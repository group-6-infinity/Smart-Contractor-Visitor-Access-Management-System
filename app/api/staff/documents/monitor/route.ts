import prisma from "@/lib/prisma";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { daysUntilExpiry, getExpiryStatus } from "@/lib/document-status";

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

  // status pakai getExpiryStatus/daysUntilExpiry dari lib/document-status —
  // dulu logika ini ditulis ulang inline di sini dengan angka ambang sendiri
  // (30 hari) yang beda dari implementasi lain, jadi status dokumen yang
  // sama bisa tampil beda di halaman berbeda. "REVIEW" tetap override lokal:
  // dokumen yang belum diverifikasi HSE ditandai perlu-review terlepas dari
  // tanggal expiry-nya (yang expiryDate-nya sendiri masih null/kosong).
  const enriched = docs.map((d) => {
    const days = daysUntilExpiry(d.expiryDate);
    const status = !d.isVerified ? "REVIEW" : getExpiryStatus(d.expiryDate);

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

  // Dua tingkat urgensi: "expiring7" (window EXPIRING_SOON penuh, ≤7 hari)
  // dan "expiring1" (irisan paling mendesak, ≤1 hari) — sebelumnya 30d/7d.
  // daysLeft <= 0 sudah masuk status EXPIRED (lihat getExpiryStatus), jadi
  // tidak tumpang tindih dengan dua bucket ini.
  const summary = {
    expiring7: enriched.filter((d) => d.status === "EXPIRING_SOON").length,
    expiring1: enriched.filter(
      (d) =>
        d.status === "EXPIRING_SOON" && d.daysLeft !== null && d.daysLeft <= 1,
    ).length,
    expired: enriched.filter((d) => d.status === "EXPIRED").length,
    review: enriched.filter((d) => d.status === "REVIEW").length,
  };

  let filtered = enriched;
  if (filter === "expiring7")
    filtered = enriched.filter((d) => d.status === "EXPIRING_SOON");
  else if (filter === "expiring1")
    filtered = enriched.filter(
      (d) =>
        d.status === "EXPIRING_SOON" && d.daysLeft !== null && d.daysLeft <= 1,
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
