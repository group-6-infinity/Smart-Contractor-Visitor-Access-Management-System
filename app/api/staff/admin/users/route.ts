import prisma from "@/lib/prisma";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { Role } from "@/lib/generated/prisma/enums";
import { appendAuditLog } from "@/lib/audit-log";

const BCRYPT_COST_FACTOR = 12; // NFR-004

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

export async function GET() {
  const session = await getStaffSession();
  if (!session || session.role !== "SYSTEM_ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const users = await prisma.users.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ users });
}

export async function POST(req: NextRequest) {
  const session = await getStaffSession();
  if (!session || session.role !== "SYSTEM_ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { name, email, role, password } = await req.json();

  if (!email || !role || !password) {
    return NextResponse.json(
      { message: "Email, role, and password are required" },
      { status: 400 },
    );
  }

  if (!Object.values(Role).includes(role)) {
    return NextResponse.json({ message: "Invalid role" }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json(
      { message: "Password must be at least 8 characters" },
      { status: 400 },
    );
  }

  const existing = await prisma.users.findUnique({
    where: { email: email.toLowerCase() },
  });
  if (existing) {
    return NextResponse.json(
      { message: "A staff account with this email already exists" },
      { status: 409 },
    );
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_COST_FACTOR);

  const user = await prisma.users.create({
    data: {
      name: name || null,
      email: email.toLowerCase(),
      role,
      passwordHash,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });

  try {
    await appendAuditLog({
      action: "STAFF_CREATED",
      actorId: session.id,
      actorEmail: session.email,
      targetType: "users",
      targetId: user.id,
      metadata: { email: user.email, role: user.role },
    });
  } catch (err) {
    console.error("[AUDIT LOG] append failed", err);
  }

  return NextResponse.json({ user }, { status: 201 });
}
