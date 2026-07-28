const TZ = "Asia/Jakarta";

export function parseWIBDateTime(dateStr: string, timeStr: string): Date {
  return new Date(`${dateStr}T${timeStr}:00+07:00`);
}

export function parseWIBDate(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00+07:00`);
}

export function formatTimeWIB(date: Date | string): string {
  return new Date(date).toLocaleTimeString("id-ID", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDateWIB(date: Date | string): string {
  return new Date(date).toLocaleDateString("id-ID", {
    timeZone: TZ,
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatDateTimeWIB(date: Date | string): string {
  return new Date(date).toLocaleString("id-ID", {
    timeZone: TZ,
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// versi lengkap + detik, buat timestamp dokumen (PDF evacuation list dsb)
export function formatTimestampWIB(date: Date | string): string {
  return new Date(date).toLocaleString("id-ID", {
    timeZone: TZ,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function toWIBDateKey(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-CA", { timeZone: TZ });
}
