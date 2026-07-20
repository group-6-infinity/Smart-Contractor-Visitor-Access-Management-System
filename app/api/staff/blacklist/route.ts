import prisma from "@/lib/prisma";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { createNotification } from "@/lib/notifications";
import { sendTelegramMessage } from "@/lib/telegram";
import { sendBlacklistEmail } from "@/lib/mailer";

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

export async function GET() {
  const session = await getStaffSession();
  if (!session || !["HSE_ADMIN", "HR_ADMIN"].includes(session.role)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const entries = await prisma.blacklist.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    entries: entries.map((e) => ({
      ...e,
      createdAt: e.createdAt.toISOString(),
    })),
  });
}

export async function POST(req: NextRequest) {
  const session = await getStaffSession();
  if (!session || !["HSE_ADMIN", "HR_ADMIN"].includes(session.role)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { registrationId, reason } = await req.json();

  if (!registrationId || !reason?.trim()) {
    return NextResponse.json(
      { message: "Registration and reason are required" },
      { status: 400 }
    );
  }

  const registration = await prisma.registration.findUnique({
    where: { id: registrationId },
    select: { id: true, fullName: true, email: true },
  });

  if (!registration) {
    return NextResponse.json(
      { message: "Registration not found" },
      { status: 404 }
    );
  }

  const existing = await prisma.blacklist.findFirst({
    where: { email: registration.email },
    select: { id: true },
  });
  if (existing) {
    return NextResponse.json(
      { message: "This person is already blacklisted" },
      { status: 409 }
    );
  }

  const entry = await prisma.blacklist.create({
    data: {
      fullName: registration.fullName,
      email: registration.email,
      reason,
      registrationId: registration.id,
      blacklistedBy: session.id,
    },
  });

  try {
    await createNotification({
      type: "BLACKLIST_ALERT",
      title: "Blacklist entry added",
      message: `${registration.fullName} (${registration.email}) has been blacklisted. Reason: ${reason}`,
    });
  } catch {
    console.error("[NOTIFICATION] blacklist notify failed");
  }

  try {
    await sendTelegramMessage(
      "HSE",
      `🚫 <b>Person Blacklisted</b>\n\n` +
        `<b>Name:</b> ${registration.fullName}\n` +
        `<b>Email:</b> ${registration.email}\n` +
        `<b>Reason:</b> ${reason}\n` +
        `<b>By:</b> ${session.email}`
    );
  } catch {
    console.error("[TELEGRAM] blacklist notify failed");
  }

  try {
    await sendBlacklistEmail({
      to: registration.email,
      fullName: registration.fullName,
      reason,
    });
  } catch (emailErr) {
    console.error("[EMAIL] blacklist notify failed:", emailErr);
  }

  return NextResponse.json(
    { entry: { ...entry, createdAt: entry.createdAt.toISOString() } },
    { status: 201 }
  );
}

export async function DELETE(req: NextRequest) {
  const session = await getStaffSession();
  if (!session || !["HSE_ADMIN", "HR_ADMIN"].includes(session.role)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await req.json();
  if (!id) {
    return NextResponse.json({ message: "ID is required" }, { status: 400 });
  }

  const entry = await prisma.blacklist.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!entry) {
    return NextResponse.json({ message: "Entry not found" }, { status: 404 });
  }

  await prisma.blacklist.delete({ where: { id } });

  return NextResponse.json({ message: "Blacklist entry removed" });
}
