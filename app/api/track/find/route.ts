import prisma from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  const { email } = await req.json()

  if (!email) {
    return NextResponse.json({ message: "Email is required" }, { status: 400 })
  }

  const registrations = await prisma.registration.findMany({
    where: { email: email.toLowerCase() },
    select: {
      trackingToken: true,
      type: true,
      fullName: true,
      company: true,
      status: true,
    },
  })

  if (!registrations.length) {
    return NextResponse.json(
      { message: "No registration found with this email" },
      { status: 404 }
    )
  }

  return NextResponse.json({ registrations })
}
