import prisma from "@/lib/prisma";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

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

export async function GET(req: NextRequest) {
  const session = await getStaffSession();
  if (!session || !["HSE_ADMIN", "HR_ADMIN"].includes(session.role)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const filter = req.nextUrl.searchParams.get("filter") ?? "all";

  const docs = await prisma.documents.findMany({
    where: {
      isActive: true,
      Registration: { status: "APPROVED" },
    },
    select: {
      id: true,
      type: true,
      expiryDate: true,
      isVerified: true,
      filePath: true,
      Registration: {
        select: { id: true, fullName: true, company: true, email: true },
      },
    },
  });

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const enriched = docs.map((d) => {
    const days = d.expiryDate
      ? Math.ceil(
          (new Date(d.expiryDate).getTime() - now.getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : null;
    let status: string;
    if (!d.isVerified) status = "REVIEW";
    else if (days === null) status = "NO_EXPIRY";
    else if (days < 0) status = "EXPIRED";
    else if (days <= 30) status = "EXPIRING_SOON";
    else status = "VALID";

    return {
      id: d.id,
      type: d.type,
      expiryDate: d.expiryDate ? d.expiryDate.toISOString() : null,
      isVerified: d.isVerified,
      daysLeft: days,
      status,
      fullName: d.Registration.fullName,
      company: d.Registration.company,
      registrationId: d.Registration.id,
    };
  });

  const summary = {
    expiring30: enriched.filter(
      (d) => d.daysLeft !== null && d.daysLeft >= 0 && d.daysLeft <= 30
    ).length,
    expiring7: enriched.filter(
      (d) => d.daysLeft !== null && d.daysLeft >= 0 && d.daysLeft <= 7
    ).length,
    expired: enriched.filter((d) => d.status === "EXPIRED").length,
    review: enriched.filter((d) => d.status === "REVIEW").length,
  };

  let filtered = enriched;
  if (filter === "expiring30")
    filtered = enriched.filter(
      (d) => d.daysLeft !== null && d.daysLeft >= 0 && d.daysLeft <= 30
    );
  else if (filter === "expiring7")
    filtered = enriched.filter(
      (d) => d.daysLeft !== null && d.daysLeft >= 0 && d.daysLeft <= 7
    );
  else if (filter === "expired")
    filtered = enriched.filter((d) => d.status === "EXPIRED");
  else if (filter === "review")
    filtered = enriched.filter((d) => d.status === "REVIEW");

  filtered.sort((a, b) => {
    if (a.daysLeft === null) return 1;
    if (b.daysLeft === null) return -1;
    return a.daysLeft - b.daysLeft;
  });

  return NextResponse.json({ documents: filtered, summary });
}
