import prisma from "@/lib/prisma";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { isBlacklisted } from "@/lib/blacklist";
import { getExpiryStatus } from "@/lib/document-status";
import { assessRisk } from "@/lib/risk-scoring";
import { checkSchedule } from "@/lib/checkin-schedule";
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

  const { token } = await req.json();
  if (!token) {
    return NextResponse.json({ message: "Token is required" }, { status: 400 });
  }

  // cari VISIT by visitToken (QR sekarang unik per-visit)
  const visit = await prisma.visit.findUnique({
    where: { visitToken: token },
    select: {
      id: true,
      purpose: true,
      visitDate: true,
      windowStart: true,
      windowEnd: true,
      status: true,
      authorizedZones: true,
      Registration: {
        select: {
          id: true,
          fullName: true,
          company: true,
          email: true,
          type: true,
          photoPath: true,
          documents: {
            where: { isActive: true },
            select: {
              id: true,
              type: true,
              expiryDate: true,
              isVerified: true,
            },
          },
        },
      },
    },
  });

  if (!visit) {
    return NextResponse.json(
      { valid: false, message: "Invalid token" },
      { status: 404 },
    );
  }

  const registration = visit.Registration;

  // === BLACKLIST HARD STOP ===
  const bl = await isBlacklisted({
    email: registration.email,
    registrationId: registration.id,
  });
  if (bl.blocked) {
    // Persist this as a real denied-entry event too — otherwise blacklist
    // blocks (unlike manual "Deny Entry") never show up in the Alerts
    // page's "Recent Denied Entries" list, since nothing was ever written
    // to CheckEvent for this path before.
    try {
      const checkEvent = await prisma.checkEvent.create({
        data: {
          visitId: visit.id,
          registrationId: registration.id,
          checkInBy: session.id,
          zones: visit.authorizedZones,
          status: "DENIED",
          overrideJustification: `Blacklisted: ${bl.reason}`,
          overrideBy: session.id,
        },
      });

      await appendAuditLog({
        action: "BLACKLIST_BLOCKED",
        actorId: session.id,
        actorEmail: session.email,
        targetType: "CheckEvent",
        targetId: checkEvent.id,
        metadata: {
          registrationId: registration.id,
          fullName: registration.fullName,
          email: registration.email,
          reason: bl.reason,
          visitId: visit.id,
        },
      });
    } catch (err) {
      console.error("[AUDIT LOG / DENIED EVENT] append failed", err);
    }

    return NextResponse.json({
      valid: true,
      blocked: true,
      blacklisted: true,
      fullName: registration.fullName,
      company: registration.company,
      reason: bl.reason,
      message: "BLACKLISTED — Entry Denied. No override available.",
    });
  }

  if (visit.status !== "APPROVED") {
    return NextResponse.json({
      valid: true,
      blocked: true,
      fullName: registration.fullName,
      company: registration.company,
      message: "This visit is not approved.",
    });
  }

  // cek jadwal
  const schedule = checkSchedule(
    visit.visitDate,
    visit.windowStart,
    visit.windowEnd,
  );

  // cek udah check-in belum (buat visit ini)
  const alreadyInside = await prisma.checkEvent.findFirst({
    where: { visitId: visit.id, status: "INSIDE" },
    select: { id: true },
  });

  const risk = await assessRisk(registration.id);

  const documents = registration.documents.map((d) => ({
    id: d.id,
    type: d.type,
    isVerified: d.isVerified,
    expiryStatus: getExpiryStatus(d.expiryDate),
    expiryDate: d.expiryDate ? d.expiryDate.toISOString() : null,
  }));

  const hasExpired = documents.some((d) => d.expiryStatus === "EXPIRED");
  const hasExpiringSoon = documents.some(
    (d) => d.expiryStatus === "EXPIRING_SOON",
  );

  // Zone.riskLevel travels alongside the name so the operator can see how
  // hazardous the destination is at the moment they grant entry. It is a
  // separate axis from `risk` below: that one scores the *person* (visit
  // history, document compliance, blacklist status per FR-005), this one
  // describes the *place*. Deliberately kept out of assessRisk() — folding
  // them would make a clean-history contractor read as HIGH purely because of
  // where they are headed, which is not what FR-005 specifies.
  const zones = await prisma.zone.findMany({
    where: { id: { in: visit.authorizedZones } },
    select: { id: true, name: true, riskLevel: true },
  });
  const zoneNames = Object.fromEntries(zones.map((z) => [z.id, z.name]));
  const zoneRisks = Object.fromEntries(zones.map((z) => [z.id, z.riskLevel]));

  return NextResponse.json({
    valid: true,
    blocked: false,
    blacklisted: false,
    alreadyInside: !!alreadyInside,
    scheduleAllowed: schedule.allowed,
    scheduleReason: schedule.reason,
    registration: {
      id: registration.id,
      fullName: registration.fullName,
      company: registration.company,
      type: registration.type,
      photoPath: registration.photoPath,
    },
    visit: {
      id: visit.id,
      purpose: visit.purpose,
      visitDate: visit.visitDate.toISOString(),
      windowStart: visit.windowStart.toISOString(),
      windowEnd: visit.windowEnd.toISOString(),
      authorizedZones: visit.authorizedZones,
      zoneNames,
      zoneRisks,
    },
    risk,
    documents,
    needsOverride: hasExpired,
    hasExpiringSoon,
  });
}
