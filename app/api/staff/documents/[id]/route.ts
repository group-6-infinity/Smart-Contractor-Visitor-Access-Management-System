import prisma from "@/lib/prisma";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

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

const NO_EXPIRY_TYPES = ["KTP", "FACE_PHOTO"];

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getStaffSession();
  if (!session || !["HSE_ADMIN", "HR_ADMIN"].includes(session.role)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { isVerified, expiryDate } = await req.json();

  const document = await prisma.documents.findUnique({
    where: { id },
    select: {
      id: true,
      type: true,
      Registration: { select: { status: true } },
    },
  });

  if (!document) {
    return NextResponse.json(
      { message: "Document not found" },
      { status: 404 },
    );
  }

  const noExpiry = NO_EXPIRY_TYPES.includes(document.type.toUpperCase());

  if (isVerified && !noExpiry) {
    if (!expiryDate) {
      return NextResponse.json(
        { message: "Expiry date is required to verify a document" },
        { status: 400 },
      );
    }
    const expiry = new Date(expiryDate);
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    if (expiry <= startOfToday) {
      return NextResponse.json(
        { message: "Expiry date must be a future date" },
        { status: 400 },
      );
    }
  }

  if (document.Registration.status !== "PENDING") {
    return NextResponse.json(
      { message: "Cannot modify documents of a reviewed registration" },
      { status: 403 },
    );
  }

  const updated = await prisma.documents.update({
    where: { id },
    data: {
      isVerified: isVerified ?? undefined,
      expiryDate:
        isVerified && noExpiry
          ? null
          : expiryDate
            ? new Date(expiryDate)
            : undefined,
      verifiedById: isVerified ? session.id : undefined,
      verifiedAt: isVerified ? new Date() : undefined,
    },
    select: { id: true, type: true, isVerified: true, expiryDate: true },
  });

  return NextResponse.json({ document: updated });
}
