import prisma from "@/lib/prisma";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { createNotification } from "@/lib/notifications";
import { sendTelegramMessage } from "@/lib/telegram";
import { sendBlacklistEmail } from "@/lib/mailer";
import { appendAuditLog } from "@/lib/audit-log";

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
  // read access is shared with Security (their "Watchlist" view is read-only —
  // see the notice in blacklist-view.tsx); only POST/DELETE below stay
  // restricted to HSE/HR, who actually manage the list.
  if (
    !session ||
    !["HSE_ADMIN", "HR_ADMIN", "SECURITY_OPERATOR"].includes(session.role)
  ) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const entries = await prisma.blacklist.findMany({
    orderBy: { createdAt: "desc" },
  });

  const registrationIds = entries
    .map((e) => e.registrationId)
    .filter((id): id is string => Boolean(id));

  const registrations = await prisma.registration.findMany({
    where: { id: { in: registrationIds } },
    select: { id: true, company: true },
  });
  const companyById = new Map(registrations.map((r) => [r.id, r.company]));

  return NextResponse.json({
    entries: entries.map((e) => ({
      ...e,
      company: e.registrationId
        ? (companyById.get(e.registrationId) ?? null)
        : null,
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
      { status: 400 },
    );
  }

  const registration = await prisma.registration.findUnique({
    where: { id: registrationId },
    select: { id: true, fullName: true, email: true },
  });

  if (!registration) {
    return NextResponse.json(
      { message: "Registration not found" },
      { status: 404 },
    );
  }

  const existing = await prisma.blacklist.findFirst({
    where: { email: registration.email },
    select: { id: true },
  });
  if (existing) {
    return NextResponse.json(
      { message: "This person is already blacklisted" },
      { status: 409 },
    );
  }

  // Blocking the person closes their open applications too. Scoped by email,
  // not by the registrationId passed in: the blacklist is facility-wide and one
  // person can hold both a CONTRACTOR and a VISITOR registration, so rejecting
  // only the one the operator happened to be looking at would leave the other
  // sitting in the review queue.
  //
  // APPROVED registrations are demoted as well — that is the whole point, since
  // an approved registration is what unlocks visit requests. Done in the same
  // transaction as the blacklist entry so the two can't disagree.
  const affected = await prisma.registration.findMany({
    where: {
      email: registration.email,
      status: { in: ["PENDING", "APPROVED"] },
    },
    select: { id: true, type: true, status: true },
  });

  // Open visits are cancelled alongside the registrations. Leaving an APPROVED
  // visit behind means the person keeps a QR code that looks valid, a PENDING
  // one keeps sitting in the HSE approval queue, and if the block is later
  // removed they could walk in on a permission granted *before* whatever got
  // them blacklisted — without any fresh review. The gate blocks them either
  // way, so this is about consistency, not access.
  const affectedVisits = await prisma.visit.findMany({
    where: {
      registrationId: { in: affected.map((r) => r.id) },
      status: { in: ["PENDING", "APPROVED"] },
    },
    select: { id: true, status: true },
  });

  const rejectionReason = `Blacklisted: ${reason}`;

  const [entry] = await prisma.$transaction([
    prisma.blacklist.create({
      data: {
        fullName: registration.fullName,
        email: registration.email,
        reason,
        registrationId: registration.id,
        blacklistedBy: session.id,
      },
    }),
    prisma.registration.updateMany({
      where: { id: { in: affected.map((r) => r.id) } },
      data: { status: "REJECTED", rejectionReason },
    }),
    prisma.visit.updateMany({
      where: { id: { in: affectedVisits.map((v) => v.id) } },
      data: { status: "CANCELLED" },
    }),
  ]);

  // One audit entry per registration, separate from BLACKLIST_ADDED below —
  // a status change driven by something other than a reviewer's decision still
  // needs to be attributable.
  for (const reg of affected) {
    try {
      await appendAuditLog({
        action: "REGISTRATION_REJECTED",
        actorId: session.id,
        actorEmail: session.email,
        targetType: "Registration",
        targetId: reg.id,
        metadata: {
          fullName: registration.fullName,
          previousStatus: reg.status,
          rejectionReason,
          cause: "BLACKLIST_ADDED",
        },
      });
    } catch {
      console.error(`[AUDIT LOG] auto-reject append failed for ${reg.id}`);
    }
  }

  for (const v of affectedVisits) {
    try {
      await appendAuditLog({
        action: "VISIT_REJECTED",
        actorId: session.id,
        actorEmail: session.email,
        targetType: "Visit",
        targetId: v.id,
        metadata: {
          fullName: registration.fullName,
          previousStatus: v.status,
          newStatus: "CANCELLED",
          cause: "BLACKLIST_ADDED",
        },
      });
    } catch {
      console.error(`[AUDIT LOG] visit cancel append failed for ${v.id}`);
    }
  }

  const rejectedNote =
    affected.length > 0
      ? ` ${affected.length} open registration${affected.length === 1 ? "" : "s"} (${affected
          .map((r) => r.type)
          .join(", ")}) automatically rejected.`
      : "";

  const cancelledNote =
    affectedVisits.length > 0
      ? ` ${affectedVisits.length} open visit${affectedVisits.length === 1 ? "" : "s"} cancelled.`
      : "";

  try {
    await createNotification({
      type: "BLACKLIST_ALERT",
      title: "Blacklist entry added",
      message: `${registration.fullName} (${registration.email}) has been blacklisted. Reason: ${reason}.${rejectedNote}${cancelledNote}`,
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
        `<b>By:</b> ${session.email}` +
        (affected.length > 0
          ? `\n<b>Auto-rejected:</b> ${affected.map((r) => r.type).join(", ")}`
          : "") +
        (affectedVisits.length > 0
          ? `\n<b>Visits cancelled:</b> ${affectedVisits.length}`
          : ""),
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

  try {
    await appendAuditLog({
      action: "BLACKLIST_ADDED",
      actorId: session.id,
      actorEmail: session.email,
      targetType: "Blacklist",
      targetId: entry.id,
      metadata: {
        fullName: registration.fullName,
        email: registration.email,
        reason,
        autoRejectedRegistrations: affected.map((r) => `${r.type} (${r.id})`),
        cancelledVisits: affectedVisits.map((v) => v.id),
      },
    });
  } catch (err) {
    console.error("[AUDIT LOG] append failed", err);
  }

  return NextResponse.json(
    {
      entry: { ...entry, createdAt: entry.createdAt.toISOString() },
      autoRejected: affected.map((r) => ({ id: r.id, type: r.type })),
      cancelledVisits: affectedVisits.map((v) => v.id),
    },
    { status: 201 },
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
  });
  if (!entry) {
    return NextResponse.json({ message: "Entry not found" }, { status: 404 });
  }

  await prisma.blacklist.delete({ where: { id } });

  try {
    await appendAuditLog({
      action: "BLACKLIST_REMOVED",
      actorId: session.id,
      actorEmail: session.email,
      targetType: "Blacklist",
      targetId: entry.id,
      metadata: { fullName: entry.fullName, email: entry.email },
    });
  } catch (err) {
    console.error("[AUDIT LOG] append failed", err);
  }

  return NextResponse.json({ message: "Blacklist entry removed" });
}
