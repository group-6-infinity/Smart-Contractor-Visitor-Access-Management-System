import prisma from "@/lib/prisma";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

async function getSession() {
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
  const session = await getSession();
  if (
    !session ||
    !["SECURITY_OPERATOR", "HSE_ADMIN", "HR_ADMIN"].includes(session.role)
  ) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const events = await prisma.checkEvent.findMany({
    where: { status: "INSIDE" },
    orderBy: { checkInAt: "asc" },
    select: {
      id: true,
      checkInAt: true,
      zones: true,
      riskLevel: true,
      isOverride: true,
      Registration: {
        select: { fullName: true, company: true },
      },
      Visit: {
        select: { purpose: true, windowEnd: true },
      },
    },
  });

  const allZones = await prisma.zone.findMany({ select: { id: true, name: true } });
  const zoneNames = Object.fromEntries(allZones.map((z) => [z.id, z.name]));

  const now = Date.now();
  const roster = events.map((e) => {
    const windowEnd = e.Visit?.windowEnd
      ? new Date(e.Visit.windowEnd).getTime()
      : null;
    const isOverstay = windowEnd !== null && now > windowEnd;
    const minutesInside = Math.floor(
      (now - new Date(e.checkInAt).getTime()) / 60000
    );

    return {
      id: e.id,
      fullName: e.Registration.fullName,
      company: e.Registration.company,
      purpose: e.Visit?.purpose ?? "—",
      checkInAt: e.checkInAt.toISOString(),
      windowEnd: e.Visit?.windowEnd
        ? new Date(e.Visit.windowEnd).toISOString()
        : null,
      zones: e.zones.map((z) => zoneNames[z] ?? z),
      riskLevel: e.riskLevel,
      isOverride: e.isOverride,
      isOverstay,
      minutesInside,
    };
  });

  return NextResponse.json({ roster });
}
