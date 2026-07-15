"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ChevronRight, HardHat, User } from "lucide-react";
import { Button } from "../ui/button";

interface RegistrationRow {
  id: string;
  trackingToken: string;
  type: "CONTRACTOR" | "VISITOR";
  fullName: string;
  company: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
}

const STATUS_STYLE: Record<string, string> = {
  PENDING: "border-info-border text-info bg-info-muted",
  APPROVED: "border-success-border text-success bg-success-muted",
  REJECTED: "border-destructive text-destructive bg-destructive-muted",
};

const TABS = ["ALL", "PENDING", "APPROVED", "REJECTED"] as const;
type Tab = (typeof TABS)[number];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function RegistrationsTable({
  initialRows,
}: {
  initialRows: RegistrationRow[];
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
      <div className="border-border flex gap-1 border-b pb-2">
        {TABS.map((t) => (
          <Button
            key={t}
            onClick={() => setTab(t)}
            variant="ghost"
            className={cn(
              "relative px-4 py-2 text-sm font-medium transition-colors cursor-pointer",
              tab === t
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t.charAt(0) + t.slice(1).toLowerCase()}
            <span className="text-muted-foreground ml-1.5 text-xs">
              {counts[t]}
            </span>
            {tab === t && (
              <span className="bg-primary absolute inset-x-0 -bottom-2.5 h-0.5" />
            )}
          </Button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-muted-foreground py-16 text-center text-sm">
          No registrations in this category.
        </p>
      ) : (
        <div className="border-border overflow-hidden rounded-lg border">
          <div className="bg-muted text-muted-foreground grid grid-cols-[2fr_2fr_1fr_1.2fr_0.5fr] gap-4 px-4 py-3 text-xs font-semibold uppercase">
            <span>Name</span>
            <span>Company</span>
            <span>Type</span>
            <span>Status</span>
            <span></span>
          </div>

          {filtered.map((r, i) => (
            <Link
              key={r.id}
              href={`/staff/registrations/${r.id}`}
              className={cn(
                "hover:bg-muted/40 grid grid-cols-[2fr_2fr_1fr_1.2fr_0.5fr] items-center gap-4 px-4 py-3 text-sm transition-colors",
                i % 2 === 1 && "bg-muted/20"
              )}
            >
              <div>
                <p className="font-medium">{r.fullName}</p>
                <p className="text-muted-foreground font-mono text-xs">
                  {r.trackingToken}
                </p>
              </div>
              <span className="text-muted-foreground truncate">{r.company}</span>
              <span className="flex items-center gap-1.5 text-xs">
                {r.type === "CONTRACTOR" ? (
                  <HardHat className="h-3.5 w-3.5" />
                ) : (
                  <User className="h-3.5 w-3.5" />
                )}
                {r.type.charAt(0) + r.type.slice(1).toLowerCase()}
              </span>
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
