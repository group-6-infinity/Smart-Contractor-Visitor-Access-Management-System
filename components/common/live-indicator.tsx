"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { usePulseStatus } from "@/hooks/use-pulse";
import { PULSE_INTERVAL_MS } from "@/lib/pulse";

function relativeID(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 2) return "baru saja";
  if (seconds < 60) return `${seconds} detik lalu`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} menit lalu`;

  return `${Math.floor(minutes / 60)} jam lalu`;
}

export default function LiveIndicator({ className }: { className?: string }) {
  const { lastSyncAt, failed } = usePulseStatus();

  const [tickAt, setTickAt] = useState<number | null>(null);
  useEffect(() => {
    const id = setInterval(() => setTickAt(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const elapsed =
    lastSyncAt === null || tickAt === null
      ? 0
      : Math.max(0, tickAt - lastSyncAt);

  const seconds = Math.round(PULSE_INTERVAL_MS / 1000);

  let label: string;
  let tone: string;

  if (failed) {
    label = "Gagal menyinkronkan, mencoba lagi";
    tone = "bg-destructive";
  } else if (lastSyncAt === null) {
    label = "Menyinkronkan";
    tone = "bg-muted-foreground";
  } else {
    label = `Diperbarui ${relativeID(elapsed)}`;
    tone = "bg-success";
  }

  return (
    <span
      title={`Data dicek otomatis tiap ${seconds} detik. Pengecekan berhenti saat tab tidak aktif dan langsung dijalankan lagi saat tab dibuka kembali.`}
      className={cn(
        "text-muted-foreground inline-flex items-center gap-1.5 text-xs",
        className,
      )}
    >
      <span className="relative flex h-1.5 w-1.5">
        {!failed && (
          <span
            className={cn(
              "absolute inline-flex h-full w-full animate-ping rounded-full opacity-60",
              tone,
            )}
          />
        )}
        <span
          className={cn("relative inline-flex h-1.5 w-1.5 rounded-full", tone)}
        />
      </span>
      {label}
    </span>
  );
}
