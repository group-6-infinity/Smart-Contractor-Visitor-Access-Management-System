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

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getStaffSession();
  if (!session || !["HSE_ADMIN", "HR_ADMIN"].includes(session.role)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { isVerified, expiryDate } = await req.json();

  const document = await prisma.documents.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!document) {
    return NextResponse.json({ message: "Document not found" }, { status: 404 });
  }

  const updated = await prisma.documents.update({
    where: { id },
    data: {
      isVerified: isVerified ?? undefined,
      expiryDate: expiryDate ? new Date(expiryDate) : undefined,
      verifiedById: isVerified ? session.id : undefined,
      verifiedAt: isVerified ? new Date() : undefined,
    },
    select: {
      id: true,
      type: true,
      isVerified: true,
      expiryDate: true,
    },
  });

  return NextResponse.json({ document: updated });
}
