import { toWIBDateKey } from "./datetime";

export interface ScheduleCheck {
  allowed: boolean;
  reason: string | null;
  code: "OK" | "WRONG_DATE" | "BEFORE_WINDOW" | "AFTER_WINDOW";
}

export function checkSchedule(
  visitDate: Date,
  windowStart: Date,
  windowEnd: Date,
  now: Date = new Date()
): ScheduleCheck {
  const todayKey = toWIBDateKey(now);
  const windowDateKey = toWIBDateKey(windowStart);

  if (todayKey !== windowDateKey) {
    return {
      allowed: false,
      code: todayKey < windowDateKey ? "WRONG_DATE" : "AFTER_WINDOW",
      reason:
        todayKey < windowDateKey
          ? "Check-in not allowed yet. This visit is scheduled for a later date."
          : "This visit date has passed.",
    };
  }

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
