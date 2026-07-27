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

// GET /api/staff/security/history?q=<name or company> — search people to
// pull up their visit/check-in history from. With no query, returns the
// people with the most recent check-in activity instead of an empty list
// — same "populated by default" feel as Who's Inside, rather than making
// the operator search before seeing anything at all.
export async function GET(req: NextRequest) {
  const session = await getStaffSession();
  if (
    !session ||
    !["SECURITY_OPERATOR", "HSE_ADMIN", "HR_ADMIN"].includes(session.role)
  ) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";

  if (q.length < 2) {
    const recentEvents = await prisma.checkEvent.findMany({
      orderBy: { checkInAt: "desc" },
      distinct: ["registrationId"],
      take: 15,
      select: {
        Registration: {
          select: { id: true, fullName: true, company: true, type: true },
        },
      },
    });
    return NextResponse.json({
      results: recentEvents.map((e) => e.Registration),
      isDefault: true,
    });
  }

  const registrations = await prisma.registration.findMany({
    where: {
      OR: [
        { fullName: { contains: q, mode: "insensitive" } },
        { company: { contains: q, mode: "insensitive" } },
      ],
    },
    select: { id: true, fullName: true, company: true, type: true },
    orderBy: { fullName: "asc" },
    take: 20,
  });

  return NextResponse.json({ results: registrations, isDefault: false });
}
