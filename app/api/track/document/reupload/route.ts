import prisma from "@/lib/prisma";
import { put } from "@vercel/blob";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { createNotification } from "@/lib/notifications";
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

    const activeDocs = await prisma.documents.findMany({
      where: { registrationId: registration.id, isActive: true },
      select: { id: true, type: true },
    });

    // batch: satu file per tipe dokumen aktif, dikirim sebagai formData.get(type)
    const submissions = activeDocs
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

    // nonaktifkan dok lama + bikin dok baru (unverified) untuk seluruh batch,
    // lalu SATU kali transisi registrasi ke PENDING untuk semuanya
    const ops = uploads.flatMap(({ doc, blob }) => [
      prisma.documents.update({
        where: { id: doc.id },
        data: { isActive: false, replacedAt: new Date() },
      }),
      prisma.documents.create({
        data: {
          registrationId: registration.id,
          type: doc.type,
          filePath: blob.pathname,
          isVerified: false,
          isActive: true,
          expiryDate: null,
        },
        select: { id: true, type: true },
      }),
    ]);

    const results = await prisma.$transaction([
      ...ops,
      prisma.registration.update({
        where: { id: registration.id },
        data: { status: "PENDING" },
      }),
    ]);

    const newDocs = results
      .slice(0, ops.length)
      .filter((_, i) => i % 2 === 1) as { id: string; type: string }[];

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
        data: newDocs,
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
