import prisma from "@/lib/prisma";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { sendTelegramMessage } from "@/lib/telegram";

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

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getStaffSession();
  if (!session || !["HSE_ADMIN", "HR_ADMIN"].includes(session.role)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const registration = await prisma.registration.findUnique({
    where: { id },
    include: {
      documents: {
        select: {
          id: true,
          type: true,
          filePath: true,
          expiryDate: true,
          isVerified: true,
        },
      },
    },
  });

  if (!registration) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ registration });
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
  const { action, rejectionReason } = await req.json();

  if (!["APPROVE", "REJECT"].includes(action)) {
    return NextResponse.json({ message: "Invalid action" }, { status: 400 });
  }

  if (action === "REJECT" && !rejectionReason?.trim()) {
    return NextResponse.json(
      { message: "Rejection reason is required" },
      { status: 400 }
    );
  }

  const registration = await prisma.registration.findUnique({
    where: { id },
    select: { id: true, status: true, fullName: true },
  });

  if (!registration) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  if (registration.status !== "PENDING") {
    return NextResponse.json(
      { message: "Registration already reviewed" },
      { status: 409 }
    );
  }

  const updated = await prisma.registration.update({
    where: { id },
    data: {
      status: action === "APPROVE" ? "APPROVED" : "REJECTED",
      rejectionReason: action === "REJECT" ? rejectionReason : null,
    },
    select: { id: true, status: true, rejectionReason: true, fullName: true },
  });

  try {
    await sendTelegramMessage(
      "HSE",
      `${action === "APPROVE" ? "✅" : "❌"} <b>Registration ${updated.status}</b>\n\n` +
        `<b>Name:</b> ${updated.fullName}\n` +
        `<b>Reviewed by:</b> ${session.email}`
    );
  } catch {
    console.error("[TELEGRAM] notify failed");
  }

  return NextResponse.json({ registration: updated });
}
