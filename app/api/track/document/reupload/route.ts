import prisma from "@/lib/prisma";
import { put } from "@vercel/blob";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

// POST — re-upload an expired document via tracking token
// Body: multipart/form-data { token, documentId, file }
export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const token = form.get("token") as string;
    const documentId = form.get("documentId") as string;
    const file = form.get("file") as File;

    if (!token || !documentId || !file) {
      return NextResponse.json(
        { message: "Token, document, and file are required" },
        { status: 400 }
      );
    }

    // cari registrasi + verifikasi cookie session
    const registration = await prisma.registration.findFirst({
      where: { trackingToken: token },
      select: { id: true, email: true },
    });

    if (!registration) {
      return NextResponse.json(
        { message: "Registration not found" },
        { status: 404 }
      );
    }

    const cookieStore = await cookies();
    const sessionEmail = cookieStore.get(`track_session_${token}`)?.value;
    if (sessionEmail !== registration.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // dokumen lama harus punya registrasi ini
    const oldDoc = await prisma.documents.findFirst({
      where: { id: documentId, registrationId: registration.id },
      select: { id: true, type: true },
    });

    if (!oldDoc) {
      return NextResponse.json(
        { message: "Document not found" },
        { status: 404 }
      );
    }

    // validasi file: tipe + ukuran
    const allowed = ["image/jpeg", "image/png", "application/pdf"];
    if (!allowed.includes(file.type)) {
      return NextResponse.json(
        { message: "Only JPG, PNG, or PDF allowed" },
        { status: 400 }
      );
    }
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { message: "File must be under 5 MB" },
        { status: 400 }
      );
    }

    // upload file baru ke blob (private)
    const ext = file.name.split(".").pop();
    const blob = await put(
      `documents/${oldDoc.type.toLowerCase()}/${registration.id}-${Date.now()}.${ext}`,
      file,
      { access: "private" }
    );

    // transaksi: nonaktifkan dokumen lama + bikin dokumen baru (perlu review)
    const [, newDoc] = await prisma.$transaction([
      prisma.documents.update({
        where: { id: oldDoc.id },
        data: { isActive: false, replacedAt: new Date() },
      }),
      prisma.documents.create({
        data: {
          registrationId: registration.id,
          type: oldDoc.type,
          filePath: blob.pathname,
          isVerified: false,
          isActive: true,
          expiryDate: null, // di-set ulang HSE saat verify
        },
        select: { id: true, type: true },
      }),
    ]);

    return NextResponse.json(
      {
        message: "Document uploaded and submitted for review",
        data: newDoc,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[DOC RE-UPLOAD ERROR]", err);
    return NextResponse.json(
      { message: "Failed to upload document" },
      { status: 500 }
    );
  }
}
