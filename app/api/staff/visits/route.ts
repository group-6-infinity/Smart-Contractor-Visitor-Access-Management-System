import prisma from "@/lib/prisma";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

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

export async function GET() {
  const session = await getStaffSession();
  if (!session || !["HSE_ADMIN", "HR_ADMIN"].includes(session.role)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const visits = await prisma.visit.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      purpose: true,
      visitDate: true,
      windowStart: true,
      windowEnd: true,
      status: true,
      Registration: {
        select: { fullName: true, company: true, type: true },
      },
    },
  });

  return NextResponse.json(
    {
      visits: visits.map((v) => ({
        id: v.id,
        purpose: v.purpose,
        visitDate: v.visitDate.toISOString(),
        windowStart: v.windowStart.toISOString(),
        windowEnd: v.windowEnd.toISOString(),
        status: v.status,
        fullName: v.Registration.fullName,
        company: v.Registration.company,
        type: v.Registration.type,
      })),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
