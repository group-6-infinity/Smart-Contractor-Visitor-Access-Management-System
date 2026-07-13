import { NextRequest, NextResponse } from "next/server"
import { SignJWT } from "jose"
import bcrypt from "bcryptjs"
import prisma from "@/lib/prisma"

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email and password are required" },
        { status: 400 }
      )
    }

    const user = await prisma.users.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (!user || !user.isActive) {
      return NextResponse.json(
        { message: "Invalid email or password" },
        { status: 401 }
      )
    }

    const isValid = await bcrypt.compare(password, user.passwordHash)
    if (!isValid) {
      return NextResponse.json(
        { message: "Invalid email or password" },
        { status: 401 }
      )
    }

    const secret = new TextEncoder().encode(process.env.STAFF_JWT_SECRET)
    const token = await new SignJWT({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("8h")
      .sign(secret)

    const res = NextResponse.json(
      { message: "Login successful" },
      { status: 200 }
    )

    res.cookies.set("staff_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 8,
      path: "/",
    })

    return res
  } catch (err) {
    console.error("[STAFF LOGIN ERROR]", err)
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    )
  }
}
