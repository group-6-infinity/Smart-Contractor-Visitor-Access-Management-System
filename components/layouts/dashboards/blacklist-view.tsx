"use client";

import { useEffect, useState } from "react";
import { ShieldBan, Info, Eye } from "lucide-react";
import { formatDateWIB } from "@/lib/datetime";
import CustomDialog from "@/components/common/c-dialog";

interface BlacklistRow {
  id: string;
  fullName: string;
  company: string | null;
  reason: string;
  createdAt: string;
}

export default function BlacklistView() {
  const [entries, setEntries] = useState<BlacklistRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      await Promise.resolve();
      if (!active) return;
      try {
        const res = await fetch("/api/staff/blacklist");
        if (!res.ok || !active) return;
        const data = await res.json();
        if (active) setEntries(data.entries ?? data);
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-4">
      {/* Read-only notice — SO ga bisa edit (NFR-011 / FR-013) */}
      <div className="border-info-border bg-info-muted text-info flex items-start gap-2 rounded-lg border p-3 text-sm">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          View only. Blacklist management is handled by HSE/HR. Blacklisted
          individuals are automatically denied entry at check-in.
        </p>
      </div>

      {loading ? (
        <p className="text-muted-foreground py-16 text-center text-sm">
          Loading...
        </p>
      ) : entries.length === 0 ? (
        <p className="text-muted-foreground py-16 text-center text-sm">
          No blacklisted individuals.
        </p>
      ) : (
        <div className="border-border overflow-hidden rounded-lg border">
          <div className="bg-muted text-muted-foreground grid grid-cols-[1.4fr_1.4fr_2fr_1fr] gap-4 px-4 py-3 text-xs font-semibold uppercase">
            <span>Name</span>
            <span>Company</span>
            <span>Reason</span>
            <span>Since</span>
          </div>
          {entries.map((e, i) => (
            <div
              key={e.id}
              className={`grid grid-cols-[1.4fr_1.4fr_2fr_1fr] items-center gap-4 px-4 py-3 text-sm ${
                i % 2 === 1 ? "bg-muted/20" : ""
              }`}
            >
              <span className="flex items-center gap-1.5 font-medium">
                <ShieldBan className="text-destructive h-3.5 w-3.5" />
                {e.fullName}
              </span>
              <span className="text-muted-foreground truncate">
                {e.company ?? "—"}
              </span>
              <span className="flex items-center gap-1.5 overflow-hidden">
                <span className="text-muted-foreground truncate">
                  {e.reason}
                </span>
                <CustomDialog
                  title={`Blacklist reason — ${e.fullName}`}
                  className="max-w-md"
                  trigger={
                    <button
                      className="text-primary shrink-0 cursor-pointer text-xs hover:underline"
                      aria-label={`View full reason for ${e.fullName}`}
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                  }
                >
                  <p className="text-sm whitespace-pre-wrap">{e.reason}</p>
                </CustomDialog>
              </span>
              <span className="text-muted-foreground text-xs">
                {formatDateWIB(e.createdAt)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
