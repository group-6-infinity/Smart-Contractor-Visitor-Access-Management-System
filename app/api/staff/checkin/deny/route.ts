import { createNotification } from "@/lib/notifications";
import prisma from "@/lib/prisma";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
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
  if (!session || !["SECURITY_OPERATOR", "HSE_ADMIN", "HR_ADMIN"].includes(session.role)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { token, reason } = await req.json();

  // `token` here is the QR-scanned value, which is the per-visit
  // `visitToken` (same lookup key used by validate/confirm) — not the
  // registration-level `trackingToken`. Looking it up as a trackingToken
  // always misses, which is why this route was 404ing on every deny.
  const visit = await prisma.visit.findUnique({
    where: { visitToken: token },
    select: {
      id: true,
      authorizedZones: true,
      Registration: { select: { id: true, fullName: true } },
    },
  });

  if (!visit) {
    return NextResponse.json({ message: "Invalid token" }, { status: 404 });
  }

  const registration = visit.Registration;

  const checkEvent = await prisma.checkEvent.create({
    data: {
      visitId: visit.id,
      registrationId: registration.id,
      checkInBy: session.id,
      zones: visit.authorizedZones,
      status: "DENIED",
      overrideJustification: reason ?? "Entry denied by security operator",
      overrideBy: session.id,
    },
  });

  try {
    await appendAuditLog({
      action: "CHECK_IN_DENIED",
      actorId: session.id,
      actorEmail: session.email,
      targetType: "CheckEvent",
      targetId: checkEvent.id,
      metadata: {
        registrationId: registration.id,
        fullName: registration.fullName,
        visitId: visit.id,
        reason: reason ?? null,
      },
    });
  } catch (err) {
    console.error("[AUDIT LOG] append failed", err);
  }

  try {
    await createNotification({
      type: "BLACKLIST_ALERT",
      title: "Entry denied at gate",
      message: `${registration.fullName} was denied entry by ${session.email}${reason ? `. Reason: ${reason}` : ""}`,
    });
  } catch {
    console.error("[NOTIFICATION] deny notify failed");
  }

  return NextResponse.json({ message: "Entry denied and logged" });
}
