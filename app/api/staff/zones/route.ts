import prisma from "@/lib/prisma";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { RiskLevel } from "@/lib/generated/prisma/enums";
import { appendAuditLog } from "@/lib/audit-log";

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
  if (!session || !["HSE_ADMIN", "HR_ADMIN"].includes(session.role)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const zones = await prisma.zone.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json({ zones });
}

export async function POST(req: NextRequest) {
  const session = await getStaffSession();
  if (!session || !["HSE_ADMIN", "HR_ADMIN"].includes(session.role)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { name, description, riskLevel } = await req.json();

  if (!name?.trim()) {
    return NextResponse.json({ message: "Name is required" }, { status: 400 });
  }
  if (!Object.values(RiskLevel).includes(riskLevel)) {
    return NextResponse.json({ message: "Invalid risk level" }, { status: 400 });
  }

  const zone = await prisma.zone.create({
    data: { name: name.trim(), description: description || null, riskLevel },
  });

  try {
    await appendAuditLog({
      action: "ZONE_CREATED",
      actorId: session.id,
      actorEmail: session.email,
      targetType: "Zone",
      targetId: zone.id,
      metadata: { name: zone.name, riskLevel: zone.riskLevel },
    });
  } catch (err) {
    console.error("[AUDIT LOG] append failed", err);
  }

  return NextResponse.json({ zone }, { status: 201 });
}
