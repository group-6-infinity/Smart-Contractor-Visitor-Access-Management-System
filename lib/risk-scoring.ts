import prisma from "@/lib/prisma";

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

export interface RiskAssessment {
  level: RiskLevel;
  isFirstVisit: boolean;
  requiresManualReview: boolean;
  reasons: string[];
}

/**
 * Hitung risk score berdasarkan history check-in orang ini.
 * Sesuai BRD AC #7: first-time visitor = MEDIUM + "Manual Review Required".
 *
 * Aturan:
 * - Belum pernah check-in (first visit) → MEDIUM + manual review flag
 * - Punya history overstay → naik ke HIGH
 * - Ada dokumen expired → HIGH
 * - Punya history bersih (>=1 check-out normal) → LOW
 */
export async function assessRisk(
  registrationId: string
): Promise<RiskAssessment> {
  const [checkHistory, expiredDocs] = await Promise.all([
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
