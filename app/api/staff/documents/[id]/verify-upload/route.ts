import prisma from "@/lib/prisma";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { createNotification } from "@/lib/notifications";
import { NotificationType } from "@/lib/generated/prisma/enums";

const NO_EXPIRY_TYPES = ["KTP", "FACE_PHOTO"];

async function getStaffSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("staff_token")?.value;
  if (!token) return null;
  try {
    const secret = new TextEncoder().encode(process.env.STAFF_JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return payload as { id: string; role: string; email: string };
  } catch {
    return null;
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getStaffSession();
  if (!session || !["HSE_ADMIN", "HR_ADMIN"].includes(session.role)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { expiryDate, noExpiry, isVerified = true } = await req.json();

  const doc = await prisma.documents.findUnique({
    where: { id },
    select: {
      id: true,
      type: true,
      Registration: { select: { id: true, fullName: true, status: true } },
    },
  });

  if (!doc) {
    return NextResponse.json({ message: "Document not found" }, { status: 404 });
  }

  // ============================================================
  // UNVERIFY (isVerified: false)
  // ============================================================
  if (isVerified === false) {
    await prisma.documents.update({
      where: { id },
      data: {
        isVerified: false,
        expiryDate: null,
        verifiedById: null,
        verifiedAt: null,
      },
    });

    // registrasi ga lengkap lagi → turunin ke PENDING kalau tadinya APPROVED
    if (doc.Registration.status === "APPROVED") {
      await prisma.registration.update({
        where: { id: doc.Registration.id },
        data: { status: "PENDING" },
      });
    }

    return NextResponse.json({
      document: { id, isVerified: false, expiryDate: null },
    });
  }

  // ============================================================
  // VERIFY (isVerified: true)
  // ============================================================
  let expiry: Date | null = null;

  if (noExpiry) {
    expiry = null;
  } else {
    if (!expiryDate) {
      return NextResponse.json(
        { message: "Expiry date is required" },
        { status: 400 },
      );
    }
    expiry = new Date(expiryDate);
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    if (expiry <= startOfToday) {
      return NextResponse.json(
        { message: "Expiry date must be a future date" },
        { status: 400 },
      );
    }
  }

  if (noExpiry && !NO_EXPIRY_TYPES.includes(doc.type.toUpperCase())) {
    return NextResponse.json(
      {
        message:
          "Only KTP and Face Photo can be verified without an expiry date",
      },
      { status: 400 },
    );
  }

  await prisma.documents.update({
    where: { id },
    data: {
      isVerified: true,
      expiryDate: expiry,
      verifiedById: session.id,
      verifiedAt: new Date(),
    },
  });

  // ============================================================
  // AUTO-APPROVE: semua dokumen verified + registrasi PENDING → APPROVED
  // ============================================================
  const reg = await prisma.registration.findUnique({
    where: { id: doc.Registration.id },
    select: {
      id: true,
      status: true,
      documents: {
        where: { isActive: true },
        select: { isVerified: true },
      },
    },
  });

  let autoApproved = false;
  if (reg && reg.status === "PENDING") {
    const allVerified =
      reg.documents.length > 0 && reg.documents.every((d) => d.isVerified);
    if (allVerified) {
      await prisma.registration.update({
        where: { id: reg.id },
        data: { status: "APPROVED" },
      });
      autoApproved = true;
    }
  }

  try {
    await createNotification({
      type: NotificationType.DOCUMENT_EXPIRY,
      title: autoApproved ? "Registration approved" : "Document verified",
      message: autoApproved
        ? `All documents for ${doc.Registration.fullName} are verified. Registration approved.`
        : `${doc.type} for ${doc.Registration.fullName} has been verified.`,
    });
  } catch {
    console.error("[NOTIFICATION] verify notify failed");
  }

  return NextResponse.json({
    document: {
      id,
      isVerified: true,
      expiryDate: expiry ? expiry.toISOString() : null,
    },
    autoApproved,
  });
}
