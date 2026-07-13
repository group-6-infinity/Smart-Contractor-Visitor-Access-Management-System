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

  const res = NextResponse.json({ verified: true })
  res.cookies.set(`track_session_${token}`, registration.email, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 24,
    path: "/",
  })

  return res
}
