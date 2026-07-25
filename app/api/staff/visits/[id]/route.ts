import { sendVisitStatusEmail } from "@/lib/mailer";
import prisma from "@/lib/prisma";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
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

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getStaffSession();
  if (!session || !["HSE_ADMIN", "HR_ADMIN"].includes(session.role)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const visit = await prisma.visit.findUnique({
    where: { id },
    select: {
      id: true,
      purpose: true,
      visitDate: true,
      windowStart: true,
      windowEnd: true,
      status: true,
      authorizedZones: true,
      Registration: {
        select: {
          fullName: true,
          company: true,
          email: true,
          type: true,
          documents: {
            where: { isActive: true },
            select: {
              id: true,
              type: true,
              expiryDate: true,
              isVerified: true,
            },
          },
        },
      },
    },
  });

  if (!visit) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ visit });
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
  const { action, zones } = await req.json();

  if (!["APPROVE", "REJECT"].includes(action)) {
    return NextResponse.json({ message: "Invalid action" }, { status: 400 });
  }

  if (action === "APPROVE" && (!Array.isArray(zones) || zones.length === 0)) {
    return NextResponse.json(
      { message: "Please assign at least one zone before approving" },
      { status: 400 },
    );
  }

  const visit = await prisma.visit.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      purpose: true,
      visitDate: true,
      visitToken: true,
      Registration: {
        select: {
          fullName: true,
          email: true,
          trackingToken: true,
          documents: {
            where: { isActive: true },
            select: { type: true, isVerified: true, expiryDate: true },
          },
        },
      },
    },
  });

  if (!visit) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  if (visit.status !== "PENDING") {
    return NextResponse.json(
      { message: "Visit already reviewed" },
      { status: 409 },
    );
  }

  // Guard approve: semua dokumen aktif harus VERIFIED dan punya expiry yang valid.
  if (action === "APPROVE") {
    const docs = visit.Registration.documents;
    const unverified = docs.filter((d) => !d.isVerified);
    if (unverified.length > 0) {
      return NextResponse.json(
        {
          message: `All documents must be verified before approval. Pending: ${unverified
            .map((d) => d.type)
            .join(", ")}`,
        },
        { status: 400 },
      );
    }
    // dokumen verified tapi expiry-nya null / lewat → block juga
    const invalidExpiry = docs.filter(
      (d) => d.isVerified && (!d.expiryDate || new Date(d.expiryDate) < new Date()),
    );
    if (invalidExpiry.length > 0) {
      return NextResponse.json(
        {
          message: `These documents need a valid expiry date: ${invalidExpiry
            .map((d) => d.type)
            .join(", ")}`,
        },
        { status: 400 },
      );
    }
  }

  const updated = await prisma.visit.update({
    where: { id },
    data: {
      status: action === "APPROVE" ? "APPROVED" : "REJECTED",
      authorizedZones: action === "APPROVE" ? zones : [],
    },
    select: { id: true, status: true, authorizedZones: true },
  });

  try {
    await sendVisitStatusEmail({
      to: visit.Registration.email,
      fullName: visit.Registration.fullName,
      status: updated.status as "APPROVED" | "REJECTED",
      purpose: visit.purpose,
      visitDate: visit.visitDate,
      trackingToken: visit.Registration.trackingToken,
      visitToken: visit.visitToken,
    });
  } catch {
    console.error("[EMAIL] visit status notify failed");
  }

  try {
    await appendAuditLog({
      action: action === "APPROVE" ? "VISIT_APPROVED" : "VISIT_REJECTED",
      actorId: session.id,
      actorEmail: session.email,
      targetType: "Visit",
      targetId: updated.id,
      metadata: {
        fullName: visit.Registration.fullName,
        authorizedZones: updated.authorizedZones,
      },
    });
  } catch (err) {
    console.error("[AUDIT LOG] append failed", err);
  }

  return NextResponse.json({ visit: updated });
}
