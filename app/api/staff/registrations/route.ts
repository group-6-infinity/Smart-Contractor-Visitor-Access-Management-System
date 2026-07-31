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

export async function GET(req: NextRequest) {
  const session = await getStaffSession();
  if (!session || !["HSE_ADMIN", "HR_ADMIN"].includes(session.role)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const status = req.nextUrl.searchParams.get("status");
  const q = req.nextUrl.searchParams.get("q")?.trim();

  // "q" backs the registration picker in the blacklist-add flow (see
  // blacklist-add-dialog.tsx) — blacklist entries must be created from a
  // verified registration, never a free-typed name/email, so staff search
  // here instead of typing an identity by hand.
  const registrations = await prisma.registration.findMany({
    where: {
      status: status ? (status as never) : undefined,
      ...(q
        ? {
            OR: [
              { fullName: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
              { company: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    select: {
      id: true,
      trackingToken: true,
      type: true,
      fullName: true,
      company: true,
      email: true,
      phone: true,
      status: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
    take: q ? 20 : undefined,
  });

  const blacklistedEmails = new Set(
    (
      await prisma.blacklist.findMany({
        where: { email: { in: registrations.map((r) => r.email) } },
        select: { email: true },
      })
    ).map((b) => b.email),
  );

  return NextResponse.json(
    {
      registrations: registrations.map((r) => ({
        ...r,
        isBlacklisted: blacklistedEmails.has(r.email),
      })),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
