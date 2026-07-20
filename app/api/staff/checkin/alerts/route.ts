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

  const now = Date.now();
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const inside = await prisma.checkEvent.findMany({
    where: { status: "INSIDE" },
    select: {
      id: true,
      checkInAt: true,
      riskLevel: true,
      Registration: { select: { fullName: true, company: true } },
      Visit: { select: { windowEnd: true } },
    },
  });

  const overstay = inside
    .filter((e) => {
      const we = e.Visit?.windowEnd
        ? new Date(e.Visit.windowEnd).getTime()
        : null;
      return we !== null && now > we;
    })
    .map((e) => ({
      id: e.id,
      fullName: e.Registration.fullName,
      company: e.Registration.company,
      since: e.Visit?.windowEnd
        ? new Date(e.Visit.windowEnd).toISOString()
        : null,
    }));

  const highRisk = inside
    .filter((e) => e.riskLevel === "HIGH")
    .map((e) => ({
      id: e.id,
      fullName: e.Registration.fullName,
      company: e.Registration.company,
      checkInAt: e.checkInAt.toISOString(),
    }));

  const deniedToday = await prisma.checkEvent.findMany({
    where: {
      status: "DENIED",
      createdAt: { gte: startOfToday },
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      createdAt: true,
      overrideJustification: true,
      Registration: { select: { fullName: true, company: true } },
    },
  });

  const denied = deniedToday.map((e) => ({
    id: e.id,
    fullName: e.Registration.fullName,
    company: e.Registration.company,
    reason: e.overrideJustification,
    at: e.createdAt.toISOString(),
  }));

  return NextResponse.json({
    overstay,
    highRisk,
    denied,
    summary: {
      overstay: overstay.length,
      highRisk: highRisk.length,
      denied: denied.length,
    },
  });
}
