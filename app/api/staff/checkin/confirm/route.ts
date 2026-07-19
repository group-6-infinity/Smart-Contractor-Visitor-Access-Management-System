import prisma from "@/lib/prisma";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { isBlacklisted } from "@/lib/blacklist";
import { createNotification } from "@/lib/notifications";
import { assessRisk } from "@/lib/risk-scoring";
import { checkSchedule } from "@/lib/checkin-schedule";

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

  const registration = await prisma.registration.findFirst({
    where: { trackingToken: token },
    select: {
      id: true,
      fullName: true,
      email: true,
      status: true,
      Visit: {
        where: { status: "APPROVED" },
        orderBy: { visitDate: "desc" },
        take: 1,
        select: {
          id: true,
          authorizedZones: true,
          visitDate: true,
          windowStart: true,
          windowEnd: true,
        },
      },
    },
  });

  if (!registration) {
    return NextResponse.json({ message: "Invalid token" }, { status: 404 });
  }

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

  if (registration.status !== "APPROVED") {
    return NextResponse.json(
      { message: "Registration not approved" },
      { status: 403 }
    );
  }

  const visit = registration.Visit[0];
  if (!visit) {
    return NextResponse.json({ message: "No approved visit" }, { status: 403 });
  }

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

  const alreadyInside = await prisma.checkEvent.findFirst({
    where: { registrationId: registration.id, status: "INSIDE" },
    select: { id: true },
  });
  if (alreadyInside) {
    return NextResponse.json({ message: "Already checked in" }, { status: 409 });
  }

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
        type: "BLACKLIST_ALERT",
        title: "Manual override at check-in",
        message: `${registration.fullName} was granted entry via override by ${session.email}. Justification: ${justification}`,
      });
    } catch {
      console.error("[NOTIFICATION] override notify failed");
    }
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
