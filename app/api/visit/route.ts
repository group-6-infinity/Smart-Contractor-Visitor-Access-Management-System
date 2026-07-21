import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { createNotification } from "@/lib/notifications";
import { sendTelegramMessage } from "@/lib/telegram";
import { NotificationType } from "@/lib/generated/prisma/enums";
import { parseWIBDate } from "@/lib/datetime";
import { generateVisitToken } from "@/lib/visit-token";

export async function POST(req: NextRequest) {
  try {
    const { token, visitDate, purpose, windowStart, windowEnd } =
      await req.json();

    if (!token || !visitDate || !purpose || !windowStart || !windowEnd) {
      return NextResponse.json(
        { message: "All fields are required" },
        { status: 400 },
      );
    }

    const registration = await prisma.registration.findFirst({
      where: { trackingToken: token },
      select: {
        id: true,
        email: true,
        status: true,
        fullName: true,
        company: true,
      },
    });

    if (!registration) {
      return NextResponse.json(
        { message: "Registration not found" },
        { status: 404 },
      );
    }

    const cookieStore = await cookies();
    const sessionEmail = cookieStore.get(`track_session_${token}`)?.value;
    if (sessionEmail !== registration.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (registration.status !== "APPROVED") {
      return NextResponse.json(
        { message: "Registration must be approved before requesting a visit" },
        { status: 403 },
      );
    }

    const visitDateObj = new Date(visitDate);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const minDate = new Date(now);
    const maxDate = new Date(now);
    maxDate.setMonth(maxDate.getMonth() + 1);

    if (visitDateObj < minDate) {
      return NextResponse.json(
        { message: "Visit date cannot be in the past" },
        { status: 400 },
      );
    }
    if (visitDateObj > maxDate) {
      return NextResponse.json(
        { message: "Visit date cannot be more than 1 month from today" },
        { status: 400 },
      );
    }

    const start = new Date(windowStart);
    const end = new Date(windowEnd);
    if (end <= start) {
      return NextResponse.json(
        { message: "Window end must be after window start" },
        { status: 400 },
      );
    }

    // generate token unik per-visit buat QR gate pass
    const visitToken = await generateVisitToken();

    const visit = await prisma.visit.create({
      data: {
        registrationId: registration.id,
        visitToken,
        purpose,
        visitDate: parseWIBDate(visitDate),
        windowStart: start,
        windowEnd: end,
        authorizedZones: [],
        status: "PENDING",
      },
    });

    // display tanggal pakai WIB
    const visitDateStr = new Date(
      visitDate + "T00:00:00+07:00",
    ).toLocaleDateString("id-ID", {
      timeZone: "Asia/Jakarta",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    try {
      await createNotification({
        type: NotificationType.VISIT_REQUEST,
        title: "New visit request",
        message: `${registration.fullName} (${registration.company}) requested a visit on ${visitDateStr}. "${purpose}". Awaiting review.`,
      });
    } catch {
      console.error("[NOTIFICATION] visit request notify failed");
    }

    try {
      await sendTelegramMessage(
        "HSE",
        `🗓️ *New Visit Request*\n\n` +
          `Name: ${registration.fullName}\n` +
          `Company: ${registration.company}\n` +
          `Date: ${visitDateStr}\n` +
          `Purpose: ${purpose}\n\n` +
          `Please review in the dashboard.`,
      );
    } catch {
      console.error("[TELEGRAM] visit request notify failed");
    }

    return NextResponse.json(
      { message: "Visit request submitted", data: visit },
      { status: 201 },
    );
  } catch (err) {
    console.error("[VISIT REQUEST ERROR]", err);
    return NextResponse.json(
      { message: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 },
    );
  }
}
