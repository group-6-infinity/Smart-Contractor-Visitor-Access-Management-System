"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { HardHat, User, DoorOpen, AlertTriangle, Users } from "lucide-react";
import { formatTimeWIB } from "@/lib/datetime";

interface InsideRow {
  id: string;
  fullName: string;
  company: string;
  type: string;
  zones: string[];
  purpose: string;
  checkInAt: string;
  windowEnd: string;
  isOverstay: boolean;
}

const POLL_INTERVAL = 30000;
export default function WhosInsideTable({
  initialRows,
}: {
  initialRows: InsideRow[];
}) {
  const [rows, setRows] = useState<InsideRow[]>(initialRows);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  // polling biar data who's inside update (overstay flag ikut ke-refresh)
  useEffect(() => {
    let active = true;

    async function poll() {
      try {
        const res = await fetch("/api/staff/whos-inside");
        if (!res.ok || !active) return;
        const data = await res.json();
        if (!active) return;
        setRows(data.inside);
      } catch {
        // silent
      }
    }

    const interval = setInterval(poll, POLL_INTERVAL);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  async function handleCheckout(id: string) {
    setLoadingId(id);
    try {
      const res = await fetch("/api/staff/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checkEventId: id }),
      });
      if (res.ok) {
        setRows((prev) => prev.filter((r) => r.id !== id));
      }
    } finally {
      setLoadingId(null);
    }
  }

  if (rows.length === 0) {
    return (
      <div className="text-muted-foreground border-border flex flex-col items-center gap-2 rounded-lg border border-dashed py-16 text-center">
        <Users className="h-8 w-8 opacity-40" />
        <p className="text-sm">No one is currently inside.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="text-muted-foreground text-sm">
        <span className="text-foreground font-semibold">{rows.length}</span>{" "}
        {rows.length === 1 ? "person" : "people"} inside
        {rows.some((r) => r.isOverstay) && (
          <span className="text-destructive ml-2">
            · {rows.filter((r) => r.isOverstay).length} overstay
          </span>
        )}
      </div>

      <div className="border-border overflow-hidden rounded-lg border">
        <div className="bg-muted text-muted-foreground grid grid-cols-[2fr_1.5fr_1.5fr_1fr_auto] gap-4 px-4 py-3 text-xs font-semibold uppercase">
          <span>Name</span>
          <span>Zones</span>
          <span>Window</span>
          <span>Checked in</span>
          <span></span>
        </div>

        {rows.map((r, i) => (
          <div
            key={r.id}
            className={`grid grid-cols-[2fr_1.5fr_1.5fr_1fr_auto] items-center gap-4 px-4 py-3 text-sm ${
              r.isOverstay ? "bg-destructive-muted/40" : i % 2 === 1 ? "bg-muted/20" : ""
            }`}
          >
            <div className="flex items-center gap-2">
              <div className="bg-muted flex h-8 w-8 shrink-0 items-center justify-center rounded-full">
                {r.type === "CONTRACTOR" ? (
                  <HardHat className="text-muted-foreground h-4 w-4" />
                ) : (
                  <User className="text-muted-foreground h-4 w-4" />
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate font-medium">{r.fullName}</p>
                <p className="text-muted-foreground truncate text-xs">
                  {r.company}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-1">
              {r.zones.length > 0 ? (
                r.zones.map((z) => (
                  <span
                    key={z}
                    className="bg-muted rounded-full px-2 py-0.5 text-xs"
                  >
                    {z}
                  </span>
                ))
              ) : (
                <span className="text-muted-foreground text-xs">—</span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground">
                until {formatTimeWIB(r.windowEnd)}
              </span>
              {r.isOverstay && (
                <span className="text-destructive inline-flex items-center gap-1 text-xs font-medium">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Overstay
                </span>
              )}
            </div>

            <span className="text-muted-foreground">
              {formatTimeWIB(r.checkInAt)}
            </span>

            <Button
              size="sm"
              variant="outline"
              disabled={loadingId === r.id}
              onClick={() => handleCheckout(r.id)}
              className="cursor-pointer"
            >
              <DoorOpen className="mr-1 h-4 w-4" />
              {loadingId === r.id ? "..." : "Check out"}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
