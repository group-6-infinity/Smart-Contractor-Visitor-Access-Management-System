export const OVERSTAY_GRACE_MS = 15 * 60 * 1000;

export function isOverstay(
  windowEnd: Date | string,
  now: number = Date.now(),
): boolean {
  return now > new Date(windowEnd).getTime() + OVERSTAY_GRACE_MS;
}
