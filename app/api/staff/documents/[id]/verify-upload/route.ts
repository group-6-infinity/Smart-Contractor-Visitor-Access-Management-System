import prisma from "@/lib/prisma";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { createNotification } from "@/lib/notifications";

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
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getStaffSession();
  if (!session || !["HSE_ADMIN", "HR_ADMIN"].includes(session.role)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { expiryDate, noExpiry } = await req.json();

  let expiry: Date | null = null;

  if (noExpiry) {
    expiry = null;
  } else {
    if (!expiryDate) {
      return NextResponse.json(
        { message: "Expiry date is required" },
        { status: 400 }
      );
    }
    expiry = new Date(expiryDate);
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    if (expiry <= startOfToday) {
      return NextResponse.json(
        { message: "Expiry date must be a future date" },
        { status: 400 }
      );
    }
  }

  const doc = await prisma.documents.findUnique({
    where: { id },
    select: {
      id: true,
      type: true,
      Registration: { select: { id: true, fullName: true } },
    },
  });

  if (!doc) {
    return NextResponse.json({ message: "Document not found" }, { status: 404 });
  }

  if (noExpiry && doc.type.toUpperCase() !== "KTP") {
    return NextResponse.json(
      { message: "Only KTP can be verified without an expiry date" },
      { status: 400 }
    );
  }

  const updated = await prisma.documents.update({
    where: { id },
    data: {
      isVerified: true,
      expiryDate: expiry,
      verifiedById: session.id,
      verifiedAt: new Date(),
    },
    select: { id: true, isVerified: true, expiryDate: true },
  });

  try {
    await createNotification({
      type: "DOCUMENT_EXPIRY",
      title: "Document re-verified",
      message: `${doc.type} for ${doc.Registration.fullName} has been re-verified and is now valid.`,
    });
  } catch {
    console.error("[NOTIFICATION] doc verify notify failed");
  }

  return NextResponse.json({
    document: {
      ...updated,
      expiryDate: updated.expiryDate?.toISOString() ?? null,
    },
  });
}
