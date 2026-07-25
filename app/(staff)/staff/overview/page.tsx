import prisma from "@/lib/prisma";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Role } from "@/lib/generated/prisma/enums";
import DashboardContent from "@/components/layouts/dashboards/dashboard-content";

async function getRole(): Promise<Role | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("staff_token")?.value;
  if (!token) return null;
  try {
    const secret = new TextEncoder().encode(process.env.STAFF_JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return payload.role as Role;
  } catch {
    return null;
  }
}

interface ZonePerson {
  id: string;
  fullName: string;
  company: string;
  type: string;
}

const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;

function toWIBDateKey(date: Date): string {
  return new Date(date.getTime() + WIB_OFFSET_MS).toISOString().slice(0, 10);
}

export default async function DashboardPage() {
  const role = await getRole();

  if (role === "SECURITY_OPERATOR") redirect("/staff/security/checkin");
  if (role === "SYSTEM_ADMIN") redirect("/staff/admin/users");
  if (role !== "HSE_ADMIN" && role !== "HR_ADMIN") {
    redirect("/internal/staff/login");
  }

  const nowMs = new Date().getTime();
  const nowWIB = new Date(nowMs + WIB_OFFSET_MS);
  const startOfTodayUTC = new Date(
    Date.UTC(
      nowWIB.getUTCFullYear(),
      nowWIB.getUTCMonth(),
      nowWIB.getUTCDate(),
    ) - WIB_OFFSET_MS,
  );

  const sevenDaysAgo = new Date(startOfTodayUTC);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

  const [
    totalRegistrations,
    pendingRegistrations,
    approvedRegistrations,
    rejectedRegistrations,
    pendingVisits,
    activeVisitsToday,
    recentForTrend,
    recent,
    insideEvents,
    zones,
  ] = await Promise.all([
    prisma.registration.count(),
    prisma.registration.count({ where: { status: "PENDING" } }),
    prisma.registration.count({ where: { status: "APPROVED" } }),
    prisma.registration.count({ where: { status: "REJECTED" } }),
    prisma.visit.count({ where: { status: "PENDING" } }),
    prisma.visit.count({
      where: {
        status: { in: ["APPROVED", "ACTIVE"] },
        visitDate: { gte: startOfTodayUTC },
      },
    }),
    prisma.registration.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      select: { createdAt: true },
    }),
    prisma.registration.findMany({
      select: {
        id: true,
        fullName: true,
        company: true,
        type: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    prisma.checkEvent.findMany({
      where: { status: "INSIDE" },
      select: {
        zones: true,
        Registration: {
          select: { id: true, fullName: true, company: true, type: true },
        },
      },
    }),
    prisma.zone.findMany({
      where: { isActive: true },
      select: { id: true, name: true, riskLevel: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const trendMap: Record<string, number> = {};
  for (let i = 0; i < 7; i++) {
    const d = new Date(sevenDaysAgo);
    d.setDate(d.getDate() + i);
    trendMap[toWIBDateKey(d)] = 0;
  }
  for (const r of recentForTrend) {
    const key = toWIBDateKey(r.createdAt);
    if (key in trendMap) trendMap[key] += 1;
  }
  const trend = Object.entries(trendMap).map(([date, count]) => ({
    date,
    count,
  }));

  const zoneOccupancy: Record<string, ZonePerson[]> = {};
  for (const event of insideEvents) {
    for (const zone of event.zones) {
      if (!zoneOccupancy[zone]) zoneOccupancy[zone] = [];
      const already = zoneOccupancy[zone].some(
        (p) => p.id === event.Registration.id,
      );
      if (!already) {
        zoneOccupancy[zone].push({
          id: event.Registration.id,
          fullName: event.Registration.fullName,
          company: event.Registration.company,
          type: event.Registration.type,
        });
      }
    }
  }

  return (
    <DashboardContent
      role={role}
      stats={{
        totalRegistrations,
        pendingRegistrations,
        approvedRegistrations,
        rejectedRegistrations,
        pendingVisits,
        activeVisitsToday,
      }}
      trend={trend}
      recent={recent.map((r) => ({
        ...r,
        createdAt: r.createdAt.toISOString(),
      }))}
      zones={zones}
      zoneOccupancy={zoneOccupancy}
    />
  );
}
