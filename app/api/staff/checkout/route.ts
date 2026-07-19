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

export async function POST(req: NextRequest) {
  const session = await getStaffSession();
  if (
    !session ||
    !["SECURITY_OPERATOR", "HSE_ADMIN", "HR_ADMIN"].includes(session.role)
  ) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { checkEventId } = await req.json();
  if (!checkEventId) {
    return NextResponse.json(
      { message: "checkEventId is required" },
      { status: 400 }
    );
  }

  const event = await prisma.checkEvent.findUnique({
    where: { id: checkEventId },
    select: { id: true, status: true },
  });

  if (!event) {
    return NextResponse.json(
      { message: "Check event not found" },
      { status: 404 }
    );
  }

  if (event.status === "CHECKED_OUT") {
    return NextResponse.json(
      { message: "Already checked out" },
      { status: 409 }
    );
  }

  const updated = await prisma.checkEvent.update({
    where: { id: checkEventId },
    data: {
      checkOutAt: new Date(),
      checkOutBy: session.id,
      status: "CHECKED_OUT",
    },
    select: { id: true, checkOutAt: true, status: true },
  });

  return NextResponse.json({
    message: "Check-out successful",
    data: { ...updated, checkOutAt: updated.checkOutAt?.toISOString() },
  });
}
