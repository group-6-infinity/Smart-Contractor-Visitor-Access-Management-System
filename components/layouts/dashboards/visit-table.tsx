"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ChevronRight, HardHat, User } from "lucide-react";
import { formatDateWIB, formatTimeWIB } from "@/lib/datetime";

interface VisitRow {
  id: string;
  purpose: string;
  visitDate: string;
  windowStart: string;
  windowEnd: string;
  status: string;
  fullName: string;
  company: string;
  type: "CONTRACTOR" | "VISITOR";
}

const STATUS_STYLE: Record<string, string> = {
  PENDING: "border-info-border text-info bg-info-muted",
  APPROVED: "border-success-border text-success bg-success-muted",
  REJECTED: "border-destructive text-destructive bg-destructive-muted",
  ACTIVE: "border-info-border text-info bg-info-muted",
  COMPLETED: "border-border text-muted-foreground bg-muted",
  CANCELLED: "border-border text-muted-foreground bg-muted",
};

const TABS = ["ALL", "PENDING", "APPROVED", "REJECTED"] as const;
type Tab = (typeof TABS)[number];

export default function VisitsTable({
  initialRows,
}: {
  initialRows: VisitRow[];
}) {
  const [tab, setTab] = useState<Tab>("ALL");

  const counts = useMemo(
    () => ({
      ALL: initialRows.length,
      PENDING: initialRows.filter((r) => r.status === "PENDING").length,
      APPROVED: initialRows.filter((r) => r.status === "APPROVED").length,
      REJECTED: initialRows.filter((r) => r.status === "REJECTED").length,
    }),
    [initialRows]
  );

  const filtered = useMemo(() => {
    if (tab === "ALL") return initialRows;
    return initialRows.filter((r) => r.status === tab);
  }, [tab, initialRows]);

  return (
    <div className="space-y-4">
      <div className="border-border flex gap-1 border-b">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "relative px-4 py-2 text-sm font-medium transition-colors",
              tab === t
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t.charAt(0) + t.slice(1).toLowerCase()}
            <span className="text-muted-foreground ml-1.5 text-xs">
              {counts[t as keyof typeof counts]}
            </span>
            {tab === t && (
              <span className="bg-primary absolute inset-x-0 -bottom-px h-0.5" />
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-muted-foreground py-16 text-center text-sm">
          No visits in this category.
        </p>
      ) : (
        <div className="border-border overflow-hidden rounded-lg border">
          <div className="bg-muted text-muted-foreground grid grid-cols-[2fr_2fr_1.5fr_1.2fr_0.5fr] gap-4 px-4 py-3 text-xs font-semibold uppercase">
            <span>Visitor</span>
            <span>Purpose</span>
            <span>Date &amp; window</span>
            <span>Status</span>
            <span></span>
          </div>

          {filtered.map((r, i) => (
            <Link
              key={r.id}
              href={`/staff/visits/${r.id}`}
              className={cn(
                "hover:bg-muted/40 grid grid-cols-[2fr_2fr_1.5fr_1.2fr_0.5fr] items-center gap-4 px-4 py-3 text-sm transition-colors",
                i % 2 === 1 && "bg-muted/20"
              )}
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
              <span className="text-muted-foreground truncate">
                {r.purpose}
              </span>
              <div className="text-muted-foreground text-xs">
                <p>{formatDateWIB(r.visitDate)}</p>
                <p>
                  {formatTimeWIB(r.windowStart)} – {formatTimeWIB(r.windowEnd)}
                </p>
              </div>
              <span>
                <span
                  className={cn(
                    "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
                    STATUS_STYLE[r.status]
                  )}
                >
                  {r.status}
                </span>
              </span>
              <ChevronRight className="text-muted-foreground h-4 w-4 justify-self-end" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
