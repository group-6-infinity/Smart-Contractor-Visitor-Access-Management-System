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

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ registrationId: string }> },
) {
  const session = await getStaffSession();
  if (
    !session ||
    !["SECURITY_OPERATOR", "HSE_ADMIN", "HR_ADMIN"].includes(session.role)
  ) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { registrationId } = await params;

  const registration = await prisma.registration.findUnique({
    where: { id: registrationId },
    select: { id: true, fullName: true, company: true, type: true },
  });
  if (!registration) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  const [visits, allZones] = await Promise.all([
    prisma.visit.findMany({
      where: { registrationId },
      orderBy: { visitDate: "desc" },
      include: {
        CheckEvent: {
          orderBy: { checkInAt: "desc" },
          select: {
            status: true,
            checkInAt: true,
            checkOutAt: true,
            riskLevel: true,
            isOverride: true,
            overrideJustification: true,
          },
        },
      },
    }),
    prisma.zone.findMany({ select: { id: true, name: true } }),
  ]);

  const zoneNames = Object.fromEntries(allZones.map((z) => [z.id, z.name]));

  return NextResponse.json({
    registration,
    visits: visits.map((v) => ({
      id: v.id,
      purpose: v.purpose,
      visitDate: v.visitDate.toISOString(),
      status: v.status,
      authorizedZones: v.authorizedZones.map((z) => zoneNames[z] ?? z),
      checkEvents: v.CheckEvent.map((e) => ({
        status: e.status,
        checkInAt: e.checkInAt.toISOString(),
        checkOutAt: e.checkOutAt ? e.checkOutAt.toISOString() : null,
        riskLevel: e.riskLevel,
        isOverride: e.isOverride,
        overrideJustification: e.overrideJustification,
      })),
    })),
  });
}
