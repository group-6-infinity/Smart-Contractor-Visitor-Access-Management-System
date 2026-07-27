import prisma from "@/lib/prisma";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { isBlacklisted } from "@/lib/blacklist";
import { createNotification } from "@/lib/notifications";
import { assessRisk } from "@/lib/risk-scoring";
import { checkSchedule } from "@/lib/checkin-schedule";
import { NotificationType } from "@/lib/generated/prisma/enums";
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

export async function POST(req: NextRequest) {
  const session = await getStaffSession();
  if (
    !session ||
    !["SECURITY_OPERATOR", "HSE_ADMIN", "HR_ADMIN"].includes(session.role)
  ) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { token, override, justification } = await req.json();

  const visit = await prisma.visit.findUnique({
    where: { visitToken: token },
    select: {
      id: true,
      status: true,
      authorizedZones: true,
      visitDate: true,
      windowStart: true,
      windowEnd: true,
      Registration: {
        select: { id: true, fullName: true, email: true },
      },
    },
  });

  if (!visit) {
    return NextResponse.json({ message: "Invalid token" }, { status: 404 });
  }

  const registration = visit.Registration;

  // blacklist hard stop
  const bl = await isBlacklisted({
    email: registration.email,
    registrationId: registration.id,
  });
  if (bl.blocked) {
    return NextResponse.json(
      {
        blocked: true,
        message: "ACCESS DENIED — Blacklisted. No override permitted.",
      },
      { status: 403 }
    );
  }

  if (visit.status !== "APPROVED") {
    return NextResponse.json(
      { message: "Visit not approved" },
      { status: 403 }
    );
  }

  // enforce jadwal
  const schedule = checkSchedule(
    visit.visitDate,
    visit.windowStart,
    visit.windowEnd
  );
  if (!schedule.allowed) {
    return NextResponse.json(
      { message: schedule.reason ?? "Check-in not allowed at this time" },
      { status: 422 }
    );
  }

  // double check-in guard (buat visit ini)
  const alreadyInside = await prisma.checkEvent.findFirst({
    where: { visitId: visit.id, status: "INSIDE" },
    select: { id: true },
  });
  if (alreadyInside) {
    return NextResponse.json({ message: "Already checked in" }, { status: 409 });
  }

  // dokumen expired → override. KTP/FACE_PHOTO (null) ga dihitung
  const expiredCount = await prisma.documents.count({
    where: {
      registrationId: registration.id,
      isActive: true,
      expiryDate: { not: null, lt: new Date() },
    },
  });

  if (expiredCount > 0 && !override) {
    return NextResponse.json(
      {
        needsOverride: true,
        message: "Expired documents — manual override required",
      },
      { status: 422 }
    );
  }

  if (override && !justification?.trim()) {
    return NextResponse.json(
      { message: "Justification is required for override" },
      { status: 400 }
    );
  }

  const risk = await assessRisk(registration.id);

  const checkEvent = await prisma.checkEvent.create({
    data: {
      visitId: visit.id,
      registrationId: registration.id,
      checkInBy: session.id,
      zones: visit.authorizedZones,
      status: "INSIDE",
      riskLevel: risk.level,
      isOverride: !!override,
      overrideJustification: override ? justification : null,
      overrideBy: override ? session.id : null,
    },
  });

  if (override) {
    try {
      await createNotification({
        type: NotificationType.BLACKLIST_ALERT,
        title: "Manual override at check-in",
        message: `${registration.fullName} was granted entry via override by ${session.email}. Justification: ${justification}`,
      });
    } catch {
      console.error("[NOTIFICATION] override notify failed");
    }
  }

  try {
    await appendAuditLog({
      action: override ? "CHECK_IN_OVERRIDE" : "CHECK_IN",
      actorId: session.id,
      actorEmail: session.email,
      targetType: "CheckEvent",
      targetId: checkEvent.id,
      metadata: {
        registrationId: registration.id,
        fullName: registration.fullName,
        visitId: visit.id,
        zones: visit.authorizedZones,
        riskLevel: risk.level,
        override: !!override,
        justification: override ? justification : null,
      },
    });
  } catch (err) {
    console.error("[AUDIT LOG] append failed", err);
  }

  return NextResponse.json(
    {
      message: "Check-in successful",
      data: {
        id: checkEvent.id,
        fullName: registration.fullName,
        risk: risk.level,
        isOverride: !!override,
      },
    },
    { status: 201 }
  );
}
