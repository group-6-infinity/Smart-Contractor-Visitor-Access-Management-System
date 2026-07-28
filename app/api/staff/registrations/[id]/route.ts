import prisma from "@/lib/prisma";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { sendTelegramMessage } from "@/lib/telegram";
import { sendRegistrationEmail } from "@/lib/mailer";
import { createNotification } from "@/lib/notifications";
import { appendAuditLog } from "@/lib/audit-log";
import { isBlacklisted } from "@/lib/blacklist";

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
  { params }: { params: Promise<{ id: string }> },
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
        where: { isActive: true },
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
  { params }: { params: Promise<{ id: string }> },
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
      { status: 400 },
    );
  }

  const registration = await prisma.registration.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      fullName: true,
      email: true,
      type: true,
      trackingToken: true,
      // isActive only: a superseded row keeps its old isVerified value, so
      // without the filter a document replaced while still unverified would
      // block approval forever, even after the replacement is verified.
      documents: {
        where: { isActive: true },
        select: { type: true, isVerified: true },
      },
    },
  });

  if (!registration) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  if (registration.status !== "PENDING") {
    return NextResponse.json(
      { message: "Registration already reviewed" },
      { status: 409 },
    );
  }

  if (action === "APPROVE") {
    // Blacklist is a property of the person, so it never shows up in this
    // registration's status. The detail page renders a banner, but nothing
    // stopped a reviewer working quickly from approving anyway — and an
    // approved registration is what unlocks visit requests.
    const blocked = await isBlacklisted({
      email: registration.email,
      registrationId: registration.id,
    });
    if (blocked.blocked) {
      return NextResponse.json(
        {
          message: `${registration.fullName} is blacklisted and cannot be approved. Remove the blacklist entry first if this is a mistake.`,
        },
        { status: 409 },
      );
    }

    const unverified = registration.documents.filter((d) => !d.isVerified);
    if (unverified.length > 0) {
      return NextResponse.json(
        {
          message: `Verify all documents before approving: ${unverified
            .map((d) => d.type)
            .join(", ")}`,
        },
        { status: 409 },
      );
    }
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
        `<b>Reviewed by:</b> ${session.email}`,
    );
  } catch {
    console.error("[TELEGRAM] notify failed");
  }

  try {
    await sendRegistrationEmail({
      to: registration.email,
      fullName: registration.fullName,
      type: registration.type,
      trackingToken: registration.trackingToken,
      status: action === "APPROVE" ? "APPROVED" : "REJECTED",
      reason: action === "REJECT" ? rejectionReason : undefined,
    });
  } catch (emailErr) {
    console.error("[EMAIL] notify failed:", emailErr);
  }

  try {
    await createNotification({
      type:
        action === "APPROVE"
          ? "REGISTRATION_APPROVED"
          : "REGISTRATION_REJECTED",
      title: `Registration ${action === "APPROVE" ? "approved" : "rejected"}`,
      message: `${updated.fullName} registration has been ${
        action === "APPROVE" ? "approved" : "rejected"
      } by ${session.email}`,
    });
  } catch (notifErr) {
    console.error("[NOTIFICATION] create failed:", notifErr);
  }

  try {
    await appendAuditLog({
      action:
        action === "APPROVE"
          ? "REGISTRATION_APPROVED"
          : "REGISTRATION_REJECTED",
      actorId: session.id,
      actorEmail: session.email,
      targetType: "Registration",
      targetId: updated.id,
      metadata: {
        fullName: updated.fullName,
        rejectionReason: updated.rejectionReason,
      },
    });
  } catch (err) {
    console.error("[AUDIT LOG] append failed", err);
  }

  return NextResponse.json({ registration: updated });
}
