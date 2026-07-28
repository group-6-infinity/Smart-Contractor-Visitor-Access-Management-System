import prisma from "@/lib/prisma";
import { del, put } from "@vercel/blob";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { createNotification } from "@/lib/notifications";
import { appendAuditLog } from "@/lib/audit-log";
import { isBlacklisted } from "@/lib/blacklist";
import { NotificationType } from "@/lib/generated/prisma/enums";

const ALLOWED_MIME = ["image/jpeg", "image/png", "application/pdf"];
const MAX_SIZE = 5 * 1024 * 1024;

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const token = form.get("token") as string;

    if (!token) {
      return NextResponse.json(
        { message: "Token is required" },
        { status: 400 },
      );
    }

    const registration = await prisma.registration.findFirst({
      where: { trackingToken: token },
      select: { id: true, email: true },
    });

    if (!registration) {
      return NextResponse.json(
        { message: "Registration not found" },
        { status: 404 },
      );
    }

    const cookieStore = await cookies();
    const sessionEmail = cookieStore.get(`track_session_${token}`)?.value;
    if (sessionEmail !== registration.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // A successful re-upload sends the registration back to PENDING, so
    // without this a blacklisted person could re-enter the HSE review queue
    // just by replacing a document. Checked before any blob upload so a
    // blocked request costs nothing. Message stays vague on purpose — same
    // reasoning as the 403 in /api/register.
    const blocked = await isBlacklisted({
      email: registration.email,
      registrationId: registration.id,
    });
    if (blocked.blocked) {
      return NextResponse.json(
        {
          message:
            "This registration can no longer be updated. Please contact our HSE team.",
        },
        { status: 403 },
      );
    }

    const activeDocs = await prisma.documents.findMany({
      where: { registrationId: registration.id, isActive: true },
      // newest first — picks the surviving row when legacy data left more
      // than one row of a type active
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      select: { id: true, type: true, filePath: true },
    });

    // Satu row per tipe. Iterasi per row bikin tiap row duplikat ketemu file
    // yang sama, jadi tipe yang sudah telanjur dobel malah beranak lagi.
    const docByType = new Map<
      (typeof activeDocs)[number]["type"],
      (typeof activeDocs)[number]
    >();
    for (const doc of activeDocs) {
      if (!docByType.has(doc.type)) docByType.set(doc.type, doc);
    }

    // batch: satu file per tipe dokumen aktif, dikirim sebagai formData.get(type)
    const submissions = [...docByType.values()]
      .map((doc) => ({ doc, file: form.get(doc.type) as File | null }))
      .filter((s): s is { doc: (typeof activeDocs)[number]; file: File } =>
        Boolean(s.file),
      );

    if (submissions.length === 0) {
      return NextResponse.json(
        { message: "No files were submitted" },
        { status: 400 },
      );
    }

    for (const { doc, file } of submissions) {
      if (!ALLOWED_MIME.includes(file.type)) {
        return NextResponse.json(
          { message: `${doc.type}: only JPG, PNG, or PDF allowed` },
          { status: 400 },
        );
      }
      if (file.size > MAX_SIZE) {
        return NextResponse.json(
          { message: `${doc.type}: file must be under 5 MB` },
          { status: 400 },
        );
      }
    }

    const uploads = await Promise.all(
      submissions.map(async ({ doc, file }) => {
        const ext = file.name.split(".").pop();
        const blob = await put(
          `documents/${doc.type.toLowerCase()}/${registration.id}-${Date.now()}.${ext}`,
          file,
          { access: "private" },
        );
        return { doc, blob };
      }),
    );

    // Replace in place: satu tipe dokumen = satu row, selamanya. Row-nya
    // ditimpa (filePath baru, verifikasi direset ke nol) alih-alih di-retire
    // lalu diganti row baru — versi lama bikin tabel numpuk dan tiap query
    // yang lupa filter isActive menampilkan tipe yang sama berkali-kali.
    // Jejaknya tetap ada: replacedAt di-stamp dan DOCUMENT_REPLACED masuk
    // audit log dengan path file lamanya.
    //
    // updateMany kedua cuma buat data lama — kalau satu tipe telanjur punya
    // lebih dari satu row aktif, sisanya ikut dinonaktifkan sekalian.
    const now = new Date();
    const ops = uploads.flatMap(({ doc, blob }) => [
      prisma.documents.update({
        where: { id: doc.id },
        data: {
          filePath: blob.pathname,
          isVerified: false,
          expiryDate: null,
          verifiedById: null,
          verifiedAt: null,
          replacedAt: now,
        },
        select: { id: true, type: true },
      }),
      prisma.documents.updateMany({
        where: {
          registrationId: registration.id,
          type: doc.type,
          isActive: true,
          id: { not: doc.id },
        },
        data: { isActive: false, replacedAt: now },
      }),
    ]);

    const results = await prisma.$transaction([
      ...ops,
      prisma.registration.update({
        where: { id: registration.id },
        // rejectionReason dikosongkan: registrasi yang tadinya REJECTED balik
        // ke antrean review, jadi alasan penolakan lama tidak boleh ikut
        // menempel di record yang statusnya sudah PENDING lagi.
        data: { status: "PENDING", rejectionReason: null },
      }),
    ]);

    const replacedDocs = results
      .slice(0, ops.length)
      .filter((_, i) => i % 2 === 0) as { id: string; type: string }[];

    // Setelah commit: file lama sudah tidak direferensikan row mana pun, jadi
    // hapus biar tidak jadi orphan di blob storage. Gagal hapus tidak
    // membatalkan apa pun — dokumennya sendiri sudah tergantikan.
    const stalePaths = uploads
      .map(({ doc }) => doc.filePath)
      .filter((path) => Boolean(path));
    if (stalePaths.length > 0) {
      void del(stalePaths).catch(() =>
        console.error("[DOC RE-UPLOAD] stale blob cleanup failed", stalePaths),
      );
    }

    // Isi dokumen berubah tanpa meninggalkan row lama, jadi penggantiannya
    // dicatat di audit trail — itu satu-satunya tempat path file sebelumnya
    // masih bisa dilacak.
    try {
      await appendAuditLog({
        action: "DOCUMENT_REPLACED",
        actorEmail: registration.email,
        targetType: "Registration",
        targetId: registration.id,
        // flat keys with scalar/array-of-scalar values — the audit-log viewer
        // renders nested objects as "[object Object]"
        metadata: {
          documentIds: uploads.map(({ doc }) => doc.id),
          replacements: uploads.map(
            ({ doc, blob }) =>
              `${doc.type}: ${doc.filePath} → ${blob.pathname}`,
          ),
        },
      });
    } catch {
      console.error("[AUDIT] reupload append failed");
    }

    try {
      const types = uploads.map(({ doc }) => doc.type).join(", ");
      await createNotification({
        type: NotificationType.DOCUMENT_EXPIRY,
        title: "Documents re-uploaded",
        message: `${types} ${uploads.length > 1 ? "were" : "was"} re-uploaded and need review. Other verified documents remain valid.`,
      });
    } catch {
      console.error("[NOTIFICATION] reupload notify failed");
    }

    return NextResponse.json(
      {
        message: "Documents uploaded and submitted for review",
        data: replacedDocs,
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("[DOC RE-UPLOAD ERROR]", err);
    return NextResponse.json(
      { message: "Failed to upload documents" },
      { status: 500 },
    );
  }
}
