import { generateUniqueToken } from "@/lib/generate-url-token";
import {
  DocumentType,
  RegistrationStatus,
  RegistrationType,
} from "@/lib/generated/prisma/enums";
import { sendRegistrationEmail } from "@/lib/mailer";
import prisma from "@/lib/prisma";
import { sendTelegramMessage } from "@/lib/telegram";
import { del, put } from "@vercel/blob";
import { nanoid } from "nanoid";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const ALLOWED_IMAGE_MIME = ["image/jpeg", "image/png", "image/webp"];
const ALLOWED_DOC_MIME = [...ALLOWED_IMAGE_MIME, "application/pdf"];

const MAGIC_BYTES: { bytes: number[]; mime: string }[] = [
  { bytes: [0xff, 0xd8, 0xff], mime: "image/jpeg" },
  { bytes: [0x89, 0x50, 0x4e, 0x47], mime: "image/png" },
  { bytes: [0x52, 0x49, 0x46, 0x46], mime: "image/webp" },
  { bytes: [0x25, 0x50, 0x44, 0x46], mime: "application/pdf" },
];

async function validateFileMagicBytes(file: File): Promise<boolean> {
  const buffer = await file.slice(0, 8).arrayBuffer();
  const bytes = new Uint8Array(buffer);
  return MAGIC_BYTES.some(({ bytes: magic }) =>
    magic.every((b, i) => bytes[i] === b),
  );
}

type RegistrationRole = "CONTRACTOR" | "VISITOR";

interface DocumentConfig {
  folder: string;
  allowedMime: string[];
  required: Record<RegistrationRole, boolean>;
  documentType: DocumentType;
}

const DOCUMENT_CONFIG: Record<string, DocumentConfig> = {
  face: {
    folder: "face-photo",
    allowedMime: ALLOWED_IMAGE_MIME,
    required: { CONTRACTOR: true, VISITOR: true },
    documentType: DocumentType.FACE_PHOTO,
  },
  ktp: {
    folder: "ktp",
    allowedMime: ALLOWED_IMAGE_MIME,
    required: { CONTRACTOR: true, VISITOR: true },
    documentType: DocumentType.KTP,
  },
  bpjs: {
    folder: "bpjs",
    allowedMime: ALLOWED_DOC_MIME,
    required: { CONTRACTOR: true, VISITOR: false },
    documentType: DocumentType.BPJS,
  },
  sio: {
    folder: "sio",
    allowedMime: ALLOWED_DOC_MIME,
    required: { CONTRACTOR: true, VISITOR: false },
    documentType: DocumentType.SIO,
  },
  sia: {
    folder: "sia",
    allowedMime: ALLOWED_DOC_MIME,
    required: { CONTRACTOR: true, VISITOR: false },
    documentType: DocumentType.SIA,
  },
};

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const fullName = formData.get("fullName") as string;
    const company = formData.get("company") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    const type = (
      formData.get("type") as string
    )?.toUpperCase() as RegistrationRole;

    if (!["CONTRACTOR", "VISITOR"].includes(type)) {
      return NextResponse.json(
        { message: "Invalid registration type" },
        { status: 400 },
      );
    }

    if (!fullName || !company || !email || !phone) {
      return NextResponse.json(
        { message: "Missing required fields: fullName, company, email, phone" },
        { status: 400 },
      );
    }

    const normalizedEmail = email.toLowerCase();

    // === CEK EXISTING sesuai constraint DB (email + type) ===
    const existing = await prisma.registration.findFirst({
      where: {
        email: normalizedEmail,
        type: type as RegistrationType,
      },
      select: { id: true, status: true, trackingToken: true },
    });

    if (existing) {
      if (existing.status === "REJECTED") {
        // yang lama ditolak → boleh daftar ulang. Hapus lama (cascade hapus dokumen/visit/checkevent)
        await prisma.registration.delete({ where: { id: existing.id } });
      } else {
        // PENDING / APPROVED → tolak, arahkan ke tracking lama
        const statusText =
          existing.status === "PENDING"
            ? "sedang dalam proses review"
            : "sudah disetujui";
        return NextResponse.json(
          {
            message: `Email ini sudah terdaftar sebagai ${type} dan ${statusText}. Silakan gunakan link tracking dari email registrasi sebelumnya.`,
            existingToken: existing.trackingToken,
          },
          { status: 409 },
        );
      }
    }

    // === Validasi file ===
    const fileErrors: Record<string, string> = {};
    const validatedFiles: Record<string, File> = {};

    for (const [key, config] of Object.entries(DOCUMENT_CONFIG)) {
      const file = formData.get(key) as File | null;
      const isRequired = config.required[type];

      if (isRequired && !file) {
        fileErrors[key] = `${key.toUpperCase()} is required`;
        continue;
      }

      if (!file) continue;

      if (!config.allowedMime.includes(file.type)) {
        fileErrors[key] = `${key.toUpperCase()}: invalid file type`;
        continue;
      }

      if (file.size > 5 * 1024 * 1024) {
        fileErrors[key] = `${key.toUpperCase()}: file exceeds 5MB limit`;
        continue;
      }

      const isValidBytes = await validateFileMagicBytes(file);
      if (!isValidBytes) {
        fileErrors[key] =
          `${key.toUpperCase()}: file content does not match its type`;
        continue;
      }

      validatedFiles[key] = file;
    }

    if (Object.keys(fileErrors).length > 0) {
      return NextResponse.json(
        { message: "File validation failed", errors: fileErrors },
        { status: 400 },
      );
    }

    // === Create registration ===
    const trackingToken = await generateUniqueToken();

    let registration;
    try {
      registration = await prisma.registration.create({
        data: {
          trackingToken,
          type: type as RegistrationType,
          fullName,
          company,
          email: normalizedEmail,
          phone,
          status: RegistrationStatus.PENDING,
          photoPath: "",
        },
      });
    } catch (createErr) {
      // jaring pengaman kalau race condition lolos cek existing
      if (
        createErr &&
        typeof createErr === "object" &&
        "code" in createErr &&
        createErr.code === "P2002"
      ) {
        return NextResponse.json(
          {
            message: `Email ini sudah terdaftar sebagai ${type}. Gunakan link tracking sebelumnya atau email lain.`,
          },
          { status: 409 },
        );
      }
      throw createErr;
    }

    let uploadedBlobs: Record<string, string> = {};

    try {
      const uploadPromises = Object.entries(validatedFiles).map(
        async ([key, file]) => {
          const config = DOCUMENT_CONFIG[key];
          const ext = file.type.split("/")[1];
          const path = `${registration.id}/${config.folder}/${nanoid()}.${ext}`;
          const blob = await put(path, file, { access: "private" });
          return [key, blob.pathname] as [string, string];
        },
      );

      const results = await Promise.all(uploadPromises);
      uploadedBlobs = Object.fromEntries(results);
    } catch (uploadErr) {
      await prisma.registration.delete({ where: { id: registration.id } });

      const pathnames = Object.values(uploadedBlobs);
      if (pathnames.length > 0) {
        await Promise.allSettled(pathnames.map((p) => del(p)));
      }

      console.error("[UPLOAD ERROR]", uploadErr);
      return NextResponse.json(
        { message: "Failed to upload documents, please try again" },
        { status: 500 },
      );
    }

    await prisma.registration.update({
      where: { id: registration.id },
      data: {
        photoPath: uploadedBlobs["face"] ?? "",
        documents: {
          create: Object.entries(uploadedBlobs)
            .filter(([key]) => key in DOCUMENT_CONFIG)
            .map(([key, pathname]) => ({
              type: DOCUMENT_CONFIG[key].documentType,
              filePath: pathname,
            })),
        },
      },
    });

    try {
      await Promise.allSettled([
        sendTelegramMessage(
          "HSE",
          `📋 <b>New Registration Submitted</b>\n\n` +
            `<b>Name:</b> ${fullName}\n` +
            `<b>Company:</b> ${company}\n` +
            `<b>Type:</b> ${type}\n\n` +
            `Review at: ${process.env.NEXT_PUBLIC_APP_URL}/staff/registrations`,
        ),
        sendTelegramMessage(
          "HR",
          `📋 <b>New Registration Submitted</b>\n\n` +
            `<b>Name:</b> ${fullName}\n` +
            `<b>Company:</b> ${company}\n` +
            `<b>Type:</b> ${type}\n\n` +
            `Review at: ${process.env.NEXT_PUBLIC_APP_URL}/staff/registrations`,
        ),
      ]);
    } catch {
      console.error("[TELEGRAM] Failed to notify HSE/HR Admin");
    }

    try {
      await sendRegistrationEmail({
        to: normalizedEmail,
        fullName,
        type,
        status: "PENDING",
        trackingToken: registration.trackingToken,
      });
    } catch (emailErr) {
      console.error("[EMAIL] Failed to send registration email:", emailErr);
    }

    const cookieStore = await cookies();
    cookieStore.set("pending_tracking_token", registration.trackingToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 5,
      path: "/",
    });

    return NextResponse.json(
      { message: "Registration created successfully" },
      { status: 201 },
    );
  } catch (err) {
    console.error("[REGISTER ERROR]", err);
    return NextResponse.json(
      {
        message: err instanceof Error ? err.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
