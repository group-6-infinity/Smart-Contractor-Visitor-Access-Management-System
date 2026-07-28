import prisma from "@/lib/prisma";
import { isBlacklisted } from "@/lib/blacklist";

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

export interface RiskAssessment {
  level: RiskLevel;
  isFirstVisit: boolean;
  requiresManualReview: boolean;
  reasons: string[];
}

/**
 * Hitung risk score untuk ORANG-nya, bukan untuk zona yang dia tuju.
 *
 * BRD Bab II mendefinisikan tiga masukan engine ini: visit history, document
 * compliance, dan blacklist status. Risk level zona (Zone.riskLevel) sengaja
 * TIDAK ikut — itu sumbu terpisah yang menggambarkan tempat, bukan orang, dan
 * memasukkannya bikin kontraktor berriwayat bersih terbaca HIGH cuma karena
 * tujuannya berbahaya. Zona ditampilkan sebagai badge sendiri di konsol
 * check-in (lihat checkin/validate).
 *
 * Sesuai BRD AC #7: first-time visitor = MEDIUM + "Manual Review Required".
 *
 * Aturan, dari yang paling menentukan:
 * - Masuk blacklist → HIGH + manual review
 * - Ada dokumen expired → HIGH
 * - Punya history overstay → HIGH
 * - Belum pernah check-in (first visit) → MEDIUM + manual review flag
 * - Punya history bersih (>=1 check-out normal) → LOW
 */
export async function assessRisk(
  registrationId: string,
): Promise<RiskAssessment> {
  const [registration, checkHistory, expiredDocs] = await Promise.all([
    prisma.registration.findUnique({
      where: { id: registrationId },
      select: { email: true },
    }),
    prisma.checkEvent.findMany({
      where: { registrationId },
      select: { status: true },
    }),
    prisma.documents.count({
      where: {
        registrationId,
        isActive: true,
        expiryDate: { lt: new Date() },
      },
    }),
  ]);

  const reasons: string[] = [];

  // Blacklist = faktor ketiga yang disebut BRD. Praktisnya jarang terlihat
  // karena check-in sudah hard-stop lebih dulu, tapi assessRisk() juga dipakai
  // di jalur lain, dan deskripsi BRD menyebut faktor ini secara eksplisit.
  // Dicek per email, bukan per registrationId: Blacklist.registrationId
  // menunjuk ke satu registrasi saja, sedangkan blokirnya berlaku untuk
  // orangnya — termasuk registrasi tipe lain milik email yang sama.
  if (registration) {
    const blocked = await isBlacklisted({
      email: registration.email,
      registrationId,
    });
    if (blocked.blocked) {
      reasons.push(`Blacklisted${blocked.reason ? `: ${blocked.reason}` : ""}`);
      return {
        level: "HIGH",
        isFirstVisit: checkHistory.length === 0,
        requiresManualReview: true,
        reasons,
      };
    }
  }

  // dokumen expired → HIGH (harusnya udah keblok, tapi jaga-jaga)
  if (expiredDocs > 0) {
    reasons.push(`${expiredDocs} expired document(s)`);
    return {
      level: "HIGH",
      isFirstVisit: checkHistory.length === 0,
      requiresManualReview: true,
      reasons,
    };
  }

  // pernah overstay → HIGH
  const hasOverstay = checkHistory.some((c) => c.status === "OVERSTAY");
  if (hasOverstay) {
    reasons.push("Previous overstay recorded");
    return {
      level: "HIGH",
      isFirstVisit: false,
      requiresManualReview: true,
      reasons,
    };
  }

  // first visit → MEDIUM + manual review (AC #7)
  if (checkHistory.length === 0) {
    reasons.push("First visit — no prior history");
    return {
      level: "MEDIUM",
      isFirstVisit: true,
      requiresManualReview: true,
      reasons,
    };
  }

  // history bersih → LOW
  reasons.push("Clean visit history");
  return {
    level: "LOW",
    isFirstVisit: false,
    requiresManualReview: false,
    reasons,
  };
}
