import prisma from "@/lib/prisma";
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

export async function GET() {
  const session = await getStaffSession();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const [notifications, readState] = await Promise.all([
    prisma.notification.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.notificationRead.findUnique({ where: { userId: session.id } }),
  ]);

  const lastReadAt = readState?.lastReadAt ?? new Date(0);
  const unreadCount = notifications.filter(
    (n) => n.createdAt > lastReadAt
  ).length;

  return NextResponse.json({
    notifications: notifications.map((n) => ({
      ...n,
      createdAt: n.createdAt.toISOString(),
      isRead: n.createdAt <= lastReadAt,
    })),
    unreadCount,
  });
}

// Mark all as read — update lastReadAt ke sekarang
export async function POST() {
  const session = await getStaffSession();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  await prisma.notificationRead.upsert({
    where: { userId: session.id },
    create: { userId: session.id, lastReadAt: new Date() },
    update: { lastReadAt: new Date() },
  });

  return NextResponse.json({ message: "Marked as read" });
}
