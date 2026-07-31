import prisma from "@/lib/prisma";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { PulseChannel } from "@/lib/pulse";

export const dynamic = "force-dynamic";

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

type VersionRow = Record<PulseChannel, string>;

export async function GET() {
  const session = await getStaffSession();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const rows = await prisma.$queryRaw<VersionRow[]>`
    SELECT
      (SELECT COUNT(*)::text || ':' || COALESCE(MAX("createdAt")::text, '-')
         FROM "Notification")
      || '|' ||
      (SELECT COALESCE(MAX("lastReadAt")::text, '-')
         FROM "NotificationRead") AS notifications,
      (SELECT COUNT(*)::text || ':' || COALESCE(MAX("updatedAt")::text, '-')
         FROM "CheckEvent") AS inside,
      (SELECT COUNT(*)::text || ':' || COALESCE(MAX("updatedAt")::text, '-')
         FROM "Visit") AS visits,
      (SELECT COUNT(*)::text || ':' || COALESCE(MAX(GREATEST("createdAt", "updatedAt"))::text, '-')
         FROM "Registration")
      || '|' ||
      (SELECT COUNT(*)::text || ':' || COALESCE(MAX("createdAt")::text, '-')
         FROM "Blacklist") AS registrations
  `;

  return NextResponse.json(
    { versions: rows[0] },
    { headers: { "Cache-Control": "no-store" } },
  );
}
