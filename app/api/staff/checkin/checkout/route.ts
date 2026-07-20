import prisma from "@/lib/prisma";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

async function getSession() {
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
  const session = await getSession();
  if (
    !session ||
    !["SECURITY_OPERATOR", "HSE_ADMIN", "HR_ADMIN"].includes(session.role)
  ) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { checkEventId } = await req.json();
  if (!checkEventId) {
    return NextResponse.json(
      { message: "checkEventId is required" },
      { status: 400 }
    );
  }

  const event = await prisma.checkEvent.findUnique({
    where: { id: checkEventId },
    select: { id: true, status: true, Visit: { select: { windowEnd: true } } },
  });

  if (!event) {
    return NextResponse.json({ message: "Event not found" }, { status: 404 });
  }
  if (event.status !== "INSIDE") {
    return NextResponse.json(
      { message: "Person is not currently inside" },
      { status: 409 }
    );
  }

  const now = new Date();
  const windowEnd = event.Visit?.windowEnd
    ? new Date(event.Visit.windowEnd)
    : null;
  const finalStatus =
    windowEnd && now > windowEnd ? "OVERSTAY" : "CHECKED_OUT";

  await prisma.checkEvent.update({
    where: { id: checkEventId },
    data: {
      status: finalStatus,
      checkOutAt: now,
      checkOutBy: session.id,
    },
  });

  return NextResponse.json({
    message: "Checked out successfully",
    status: finalStatus,
  });
}
