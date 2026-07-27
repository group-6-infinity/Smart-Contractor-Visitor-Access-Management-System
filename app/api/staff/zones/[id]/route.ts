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

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getStaffSession();
  if (!session || !["HSE_ADMIN", "HR_ADMIN"].includes(session.role)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { name, description, riskLevel, isActive } = await req.json();

  const existing = await prisma.zone.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ message: "Zone not found" }, { status: 404 });
  }

  if (name !== undefined && !name.trim()) {
    return NextResponse.json({ message: "Name is required" }, { status: 400 });
  }
  if (riskLevel !== undefined && !Object.values(RiskLevel).includes(riskLevel)) {
    return NextResponse.json({ message: "Invalid risk level" }, { status: 400 });
  }

  // note: `id` is never accepted from the request body — Visit.authorizedZones
  // and CheckEvent.zones store this zone's id as a raw string, so it must
  // stay stable across edits.
  const data: {
    name?: string;
    description?: string | null;
    riskLevel?: RiskLevel;
    isActive?: boolean;
  } = {};
  if (name !== undefined) data.name = name.trim();
  if (description !== undefined) data.description = description || null;
  if (riskLevel !== undefined) data.riskLevel = riskLevel;
  if (isActive !== undefined) data.isActive = !!isActive;

  const zone = await prisma.zone.update({ where: { id }, data });

  try {
    await appendAuditLog({
      action: "ZONE_UPDATED",
      actorId: session.id,
      actorEmail: session.email,
      targetType: "Zone",
      targetId: zone.id,
      metadata: {
        name: zone.name,
        riskLevel: zone.riskLevel,
        isActive: zone.isActive,
      },
    });
  } catch (err) {
    console.error("[AUDIT LOG] append failed", err);
  }

  return NextResponse.json({ zone });
}
