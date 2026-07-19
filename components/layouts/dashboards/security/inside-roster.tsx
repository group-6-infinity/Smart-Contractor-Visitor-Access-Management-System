"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { LogOut, AlertTriangle, ShieldAlert, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RosterRow {
  id: string;
  fullName: string;
  company: string;
  purpose: string;
  checkInAt: string;
  windowEnd: string | null;
  zones: string[];
  riskLevel: string | null;
  isOverride: boolean;
  isOverstay: boolean;
  minutesInside: number;
}

const RISK_STYLE: Record<string, string> = {
  LOW: "text-success",
  MEDIUM: "text-info",
  HIGH: "text-destructive",
};

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default function InsideRoster() {
  const [roster, setRoster] = useState<RosterRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState<string | null>(null);

  async function load() {
    try {
      const res = await fetch("/api/staff/checkin/roster");
      if (!res.ok) return;
      const data = await res.json();
      setRoster(data.roster);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    async function poll() {
      await Promise.resolve();
      if (!active) return;
      await load();
    }
    poll();
    // refresh tiap 30 detik
    const interval = setInterval(() => {
      if (active) load();
    }, 30000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  async function handleCheckout(id: string) {
    setCheckingOut(id);
    try {
      const res = await fetch("/api/staff/checkin/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checkEventId: id }),
      });
      if (res.ok) {
        setRoster((prev) => prev.filter((r) => r.id !== id));
      }
    } finally {
      setCheckingOut(null);
    }
  }

  const overstayCount = roster.filter((r) => r.isOverstay).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <p className="text-sm">
            <span className="text-2xl font-bold">{roster.length}</span>
            <span className="text-muted-foreground ml-2">inside now</span>
          </p>
          {overstayCount > 0 && (
            <span className="border-destructive text-destructive bg-destructive-muted inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium">
              <AlertTriangle className="h-3.5 w-3.5" />
              {overstayCount} overstay
            </span>
          )}
        </div>
        <button
          onClick={load}
          className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {loading ? (
        <p className="text-muted-foreground py-16 text-center text-sm">
          Loading...
        </p>
      ) : roster.length === 0 ? (
        <p className="text-muted-foreground py-16 text-center text-sm">
          No one is currently inside.
        </p>
      ) : (
        <div className="border-border overflow-hidden rounded-lg border">
          <div className="bg-muted text-muted-foreground grid grid-cols-[1.4fr_1.4fr_1fr_0.9fr_0.9fr_1fr] gap-4 px-4 py-3 text-xs font-semibold uppercase">
            <span>Person</span>
            <span>Company</span>
            <span>Check-in</span>
            <span>Duration</span>
            <span>Risk</span>
            <span></span>
          </div>
          {roster.map((r, i) => (
            <div
              key={r.id}
              className={cn(
                "grid grid-cols-[1.4fr_1.4fr_1fr_0.9fr_0.9fr_1fr] items-center gap-4 px-4 py-3 text-sm",
                r.isOverstay
                  ? "bg-destructive-muted/30"
                  : i % 2 === 1
                    ? "bg-muted/20"
                    : ""
              )}
            >
              <span className="flex items-center gap-1.5 font-medium">
                {r.fullName}
                {r.isOverride && (
                  <ShieldAlert
                    className="text-primary h-3.5 w-3.5"
                    aria-label="Entered via override"
                  />
                )}
              </span>
              <span className="text-muted-foreground truncate">
                {r.company}
              </span>
              <span className="text-muted-foreground">
                {formatTime(r.checkInAt)}
              </span>
              <span
                className={cn(
                  r.isOverstay ? "text-destructive font-medium" : ""
                )}
              >
                {formatDuration(r.minutesInside)}
                {r.isOverstay && " ⚠"}
              </span>
              <span className={cn("font-medium", RISK_STYLE[r.riskLevel ?? ""])}>
                {r.riskLevel
                  ? r.riskLevel.charAt(0) + r.riskLevel.slice(1).toLowerCase()
                  : "—"}
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleCheckout(r.id)}
                disabled={checkingOut === r.id}
                className="cursor-pointer justify-self-end"
              >
                <LogOut className="mr-1 h-3.5 w-3.5" />
                {checkingOut === r.id ? "..." : "Check Out"}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
