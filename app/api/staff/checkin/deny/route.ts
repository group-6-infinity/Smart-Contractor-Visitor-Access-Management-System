import { createNotification } from "@/lib/notifications";
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

export async function POST(req: NextRequest) {
  const session = await getStaffSession();
  if (!session || !["SECURITY_OPERATOR", "HSE_ADMIN", "HR_ADMIN"].includes(session.role)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { token, reason } = await req.json();

  const registration = await prisma.registration.findFirst({
    where: { trackingToken: token },
    select: {
      id: true,
      fullName: true,
      Visit: {
        where: { status: "APPROVED" },
        orderBy: { visitDate: "desc" },
        take: 1,
        select: { id: true, authorizedZones: true },
      },
    },
  });

  if (!registration) {
    return NextResponse.json({ message: "Invalid token" }, { status: 404 });
  }

  const visit = registration.Visit[0];
  if (!visit) {
    return NextResponse.json({ message: "No approved visit" }, { status: 403 });
  }

  await prisma.checkEvent.create({
    data: {
      visitId: visit.id,
      registrationId: registration.id,
      checkInBy: session.id,
      zones: visit.authorizedZones,
      status: "DENIED",
      overrideJustification: reason ?? "Entry denied by security operator",
      overrideBy: session.id,
    },
  });

  try {
    await createNotification({
      type: "BLACKLIST_ALERT",
      title: "Entry denied at gate",
      message: `${registration.fullName} was denied entry by ${session.email}${reason ? `. Reason: ${reason}` : ""}`,
    });
  } catch {
    console.error("[NOTIFICATION] deny notify failed");
  }

  return NextResponse.json({ message: "Entry denied and logged" });
}
