import prisma from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  const { token, email } = await req.json()

  if (!token || !email) {
    return NextResponse.json(
      { message: "Token and email are required" },
      { status: 400 }
    )
  }

  const registration = await prisma.registration.findFirst({
    where: { trackingToken: token },
    select: { email: true },
  })

  if (!registration || registration.email !== email.toLowerCase()) {
    return NextResponse.json(
      { message: "Email does not match this registration" },
      { status: 401 }
    )
  }

  // Short-lived on purpose: long enough to read the status page and submit a
  // visit request, short enough that a shared or unattended browser doesn't
  // keep the registration readable. Returning to /track-status drops it too.
  // path stays "/" — /api/visit and /api/track/document/reupload read it.
  const res = NextResponse.json({ verified: true })
  res.cookies.set(`track_session_${token}`, registration.email, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60,
    path: "/",
  })

  return res
}
