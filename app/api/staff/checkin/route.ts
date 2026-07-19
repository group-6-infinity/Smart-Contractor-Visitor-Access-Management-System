import prisma from "@/lib/prisma";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { isBlacklisted } from "@/lib/blacklist";

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

/**
 * DUMMY check-in — buat ngisi CheckEvent tanpa dashboard security penuh.
 * Terima tracking token, cek visit APPROVED, blacklist hard stop,
 * lalu bikin CheckEvent (status INSIDE).
 *
 * Nanti diganti dengan flow QR scan + face recognition beneran.
 */
export async function POST(req: NextRequest) {
  const session = await getStaffSession();
  if (
    !session ||
    !["SECURITY_OPERATOR", "HSE_ADMIN", "HR_ADMIN"].includes(session.role)
  ) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { token } = await req.json();
  if (!token) {
    return NextResponse.json(
      { message: "Tracking token is required" },
      { status: 400 }
    );
  }

  const registration = await prisma.registration.findFirst({
    where: { trackingToken: token },
    select: {
      id: true,
      fullName: true,
      email: true,
      company: true,
      type: true,
      status: true,
      Visit: {
        where: { status: "APPROVED" },
        orderBy: { visitDate: "desc" },
        take: 1,
        select: { id: true, authorizedZones: true, windowEnd: true },
      },
    },
  });

  if (!registration) {
    return NextResponse.json(
      { message: "Invalid tracking token" },
      { status: 404 }
    );
  }

  const bl = await isBlacklisted({
    email: registration.email,
    registrationId: registration.id,
  });
  if (bl.blocked) {
    return NextResponse.json(
      {
        blocked: true,
        message: "ACCESS DENIED — This person is blacklisted.",
        reason: bl.reason,
      },
      { status: 403 }
    );
  }

  if (registration.status !== "APPROVED") {
    return NextResponse.json(
      { message: "Registration is not approved" },
      { status: 403 }
    );
  }

  const visit = registration.Visit[0];
  if (!visit) {
    return NextResponse.json(
      { message: "No approved visit found for this person" },
      { status: 403 }
    );
  }

  const alreadyInside = await prisma.checkEvent.findFirst({
    where: { registrationId: registration.id, status: "INSIDE" },
    select: { id: true },
  });
  if (alreadyInside) {
    return NextResponse.json(
      { message: "This person is already checked in" },
      { status: 409 }
    );
  }

  const checkEvent = await prisma.checkEvent.create({
    data: {
      visitId: visit.id,
      registrationId: registration.id,
      checkInBy: session.id,
      zones: visit.authorizedZones,
      status: "INSIDE",
    },
  });

  return NextResponse.json(
    {
      message: "Check-in successful",
      data: {
        id: checkEvent.id,
        fullName: registration.fullName,
        company: registration.company,
        type: registration.type,
        zones: visit.authorizedZones,
      },
    },
    { status: 201 }
  );
}
