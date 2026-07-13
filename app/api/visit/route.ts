import prisma from "@/lib/prisma"
import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { token, visitDate, purpose, windowStart, windowEnd } = await req.json()

    if (!token || !visitDate || !purpose || !windowStart || !windowEnd) {
      return NextResponse.json(
        { message: "All fields are required" },
        { status: 400 }
      )
    }

    const registration = await prisma.registration.findFirst({
      where: { trackingToken: token },
      select: { id: true, email: true, status: true },
    })

    if (!registration) {
      return NextResponse.json(
        { message: "Registration not found" },
        { status: 404 }
      )
    }

    // pastikan sudah verified via cookie
    const cookieStore = await cookies()
    const sessionEmail = cookieStore.get(`track_session_${token}`)?.value
    if (sessionEmail !== registration.email) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      )
    }

    // hanya registrasi APPROVED yang boleh submit visit
    if (registration.status !== "APPROVED") {
      return NextResponse.json(
        { message: "Registration must be approved before requesting a visit" },
        { status: 403 }
      )
    }

    const start = new Date(windowStart)
    const end = new Date(windowEnd)

    if (end <= start) {
      return NextResponse.json(
        { message: "Window end must be after window start" },
        { status: 400 }
      )
    }

    const visit = await prisma.visit.create({
      data: {
        registrationId: registration.id,
        purpose,
        visitDate: new Date(visitDate),
        windowStart: start,
        windowEnd: end,
        authorizedZones: [], // diisi HSE saat approve
        status: "PENDING",
      },
    })

    return NextResponse.json(
      { message: "Visit request submitted", data: visit },
      { status: 201 }
    )
  } catch (err) {
    console.error("[VISIT REQUEST ERROR]", err)
    return NextResponse.json(
      { message: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    )
  }
}
