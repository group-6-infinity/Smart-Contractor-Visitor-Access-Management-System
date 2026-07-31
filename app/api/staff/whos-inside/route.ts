import prisma from "@/lib/prisma";
import { isOverstay } from "@/lib/overstay";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

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

// GET — everyone currently inside (status INSIDE)
export async function GET() {
  const session = await getStaffSession();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const events = await prisma.checkEvent.findMany({
    where: { status: "INSIDE" },
    orderBy: { checkInAt: "desc" },
    select: {
      id: true,
      checkInAt: true,
      zones: true,
      Registration: {
        select: { fullName: true, company: true, type: true },
      },
      Visit: {
        select: { windowEnd: true, purpose: true },
      },
    },
  });

  const allZones = await prisma.zone.findMany({ select: { id: true, name: true } });
  const zoneNames = Object.fromEntries(allZones.map((z) => [z.id, z.name]));

  const now = Date.now();

  return NextResponse.json({
    inside: events.map((e) => ({
      id: e.id,
      fullName: e.Registration.fullName,
      company: e.Registration.company,
      type: e.Registration.type,
      zones: e.zones.map((z) => zoneNames[z] ?? z),
      purpose: e.Visit.purpose,
      checkInAt: e.checkInAt.toISOString(),
      windowEnd: e.Visit.windowEnd.toISOString(),
      isOverstay: isOverstay(e.Visit.windowEnd, now),
    })),
  });
}
