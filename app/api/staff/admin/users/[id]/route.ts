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

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getStaffSession();
  if (!session || session.role !== "SYSTEM_ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { name, role, isActive, password } = await req.json();

  const target = await prisma.users.findUnique({ where: { id } });
  if (!target) {
    return NextResponse.json({ message: "Staff account not found" }, { status: 404 });
  }

  if (id === session.id && isActive === false) {
    return NextResponse.json(
      { message: "You cannot deactivate your own account" },
      { status: 400 },
    );
  }

  if (role !== undefined && !Object.values(Role).includes(role)) {
    return NextResponse.json({ message: "Invalid role" }, { status: 400 });
  }

  if (password !== undefined && password.length < 8) {
    return NextResponse.json(
      { message: "Password must be at least 8 characters" },
      { status: 400 },
    );
  }

  const data: {
    name?: string | null;
    role?: Role;
    isActive?: boolean;
    passwordHash?: string;
  } = {};
  if (name !== undefined) data.name = name || null;
  if (role !== undefined) data.role = role;
  if (isActive !== undefined) data.isActive = !!isActive;
  if (password) data.passwordHash = await bcrypt.hash(password, BCRYPT_COST_FACTOR);

  const updated = await prisma.users.update({
    where: { id },
    data,
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
      action: "STAFF_UPDATED",
      actorId: session.id,
      actorEmail: session.email,
      targetType: "users",
      targetId: updated.id,
      metadata: {
        email: updated.email,
        role: updated.role,
        isActive: updated.isActive,
        passwordReset: !!password,
      },
    });
  } catch (err) {
    console.error("[AUDIT LOG] append failed", err);
  }

  return NextResponse.json({ user: updated });
}
