import prisma from "@/lib/prisma";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

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

const PAGE_SIZE = 20;

// GET /api/staff/notifications/all?type=BLACKLIST_ALERT&q=keyword&page=1
export async function GET(req: NextRequest) {
  const session = await getStaffSession();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const type = searchParams.get("type"); // optional filter
  const q = searchParams.get("q")?.trim(); // optional search
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));

  const where: Record<string, unknown> = {};
  if (type && type !== "ALL") {
    where.type = type;
  }
  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { message: { contains: q, mode: "insensitive" } },
    ];
  }

  const [notifications, total, readState] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.notification.count({ where }),
    prisma.notificationRead.findUnique({ where: { userId: session.id } }),
  ]);

  const lastReadAt = readState?.lastReadAt ?? new Date(0);

  return NextResponse.json({
    notifications: notifications.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      message: n.message,
      createdAt: n.createdAt.toISOString(),
      isRead: n.createdAt <= lastReadAt,
    })),
    total,
    page,
    pageSize: PAGE_SIZE,
    totalPages: Math.ceil(total / PAGE_SIZE),
  });
}
