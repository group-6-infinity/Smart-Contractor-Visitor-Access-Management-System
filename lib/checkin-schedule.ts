// lib/checkin-schedule.ts
// Validasi apakah check-in boleh dilakukan sekarang, sesuai jadwal visit.
// Aturan (ketat): harus di tanggal visit + dalam window jam (windowStart–windowEnd).

export interface ScheduleCheck {
  allowed: boolean;
  reason: string | null;
  code: "OK" | "WRONG_DATE" | "BEFORE_WINDOW" | "AFTER_WINDOW";
}

// Bandingin tanggal (abaikan jam) pakai WIB
const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;

function toWIBDateKey(date: Date): string {
  const wib = new Date(date.getTime() + WIB_OFFSET_MS);
  return wib.toISOString().slice(0, 10); // YYYY-MM-DD
}

export function checkSchedule(
  visitDate: Date,
  windowStart: Date,
  windowEnd: Date,
  now: Date = new Date()
): ScheduleCheck {
  const todayKey = toWIBDateKey(now);
  const visitKey = toWIBDateKey(visitDate);

  // 1. Harus tanggal yang sama dengan visit
  if (todayKey !== visitKey) {
    const nowTime = now.getTime();
    const visitTime = new Date(visitKey + "T00:00:00").getTime();
    return {
      allowed: false,
      code: nowTime < visitTime ? "WRONG_DATE" : "AFTER_WINDOW",
      reason:
        nowTime < visitTime
          ? `Check-in not allowed yet. This visit is scheduled for a later date.`
          : `This visit date has passed.`,
    };
  }

  // 2. Harus dalam window jam
  const nowMs = now.getTime();
  if (nowMs < windowStart.getTime()) {
    return {
      allowed: false,
      code: "BEFORE_WINDOW",
      reason: "Check-in not allowed yet. The visit window has not started.",
    };
  }
  if (nowMs > windowEnd.getTime()) {
    return {
      allowed: false,
      code: "AFTER_WINDOW",
      reason: "The visit window has ended.",
    };
  }

  return { allowed: true, reason: null, code: "OK" };
}
