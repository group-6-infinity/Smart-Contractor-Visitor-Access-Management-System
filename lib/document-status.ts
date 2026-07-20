  // lib/document-status.ts
export function formatReadableDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export type DocExpiryStatus = "VALID" | "EXPIRING_SOON" | "EXPIRED" | "NO_EXPIRY";
const EXPIRING_SOON_DAYS = 30;

export function getExpiryStatus(
  expiryDate: Date | string | null
): DocExpiryStatus {
  if (!expiryDate) return "NO_EXPIRY";

  const expiry = typeof expiryDate === "string" ? new Date(expiryDate) : expiryDate;
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const diffMs = expiry.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return "EXPIRED";
  if (diffDays <= EXPIRING_SOON_DAYS) return "EXPIRING_SOON";
  return "VALID";
}

export function daysUntilExpiry(expiryDate: Date | string | null): number | null {
  if (!expiryDate) return null;
  const expiry = typeof expiryDate === "string" ? new Date(expiryDate) : expiryDate;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const diffMs = expiry.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

export function getStatusLabel(
  expiryDate: Date | string | null,
  isVerified: boolean
): string {
  const status = getExpiryStatus(expiryDate);
  const verifiedPrefix = isVerified ? "Verified" : "Unverified";

  if (status === "NO_EXPIRY") return `${verifiedPrefix} · No expiry set`;

  const dateStr = formatReadableDate(expiryDate!);
  switch (status) {
    case "VALID":
      return `${verifiedPrefix} · Valid until ${dateStr}`;
    case "EXPIRING_SOON": {
      const days = daysUntilExpiry(expiryDate);
      return `${verifiedPrefix} · Expiring in ${days} day${days === 1 ? "" : "s"} (${dateStr})`;
    }
    case "EXPIRED":
      return `Expired on ${dateStr}`;
    default:
      return verifiedPrefix;
  }
}
