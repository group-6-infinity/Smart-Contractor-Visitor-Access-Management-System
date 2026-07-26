"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Search,
  HardHat,
  User,
  ShieldAlert,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDateWIB, formatTimeWIB } from "@/lib/datetime";

interface SearchResult {
  id: string;
  fullName: string;
  company: string;
  type: "CONTRACTOR" | "VISITOR";
}

interface CheckEventData {
  status: string;
  checkInAt: string;
  checkOutAt: string | null;
  riskLevel: string | null;
  isOverride: boolean;
  overrideJustification: string | null;
}

interface VisitData {
  id: string;
  purpose: string;
  visitDate: string;
  status: string;
  authorizedZones: string[];
  checkEvents: CheckEventData[];
}

interface HistoryDetail {
  registration: SearchResult;
  visits: VisitData[];
}

const VISIT_STATUS_STYLE: Record<string, string> = {
  PENDING: "border-info-border text-info bg-info-muted",
  APPROVED: "border-success-border text-success bg-success-muted",
  REJECTED: "border-destructive text-destructive bg-destructive-muted",
  ACTIVE: "border-success-border text-success bg-success-muted",
  COMPLETED: "border-border text-muted-foreground bg-muted",
  CANCELLED: "border-border text-muted-foreground bg-muted",
};

const CHECK_STATUS_STYLE: Record<string, string> = {
  INSIDE: "text-success",
  CHECKED_OUT: "text-muted-foreground",
  OVERSTAY: "text-destructive",
  DENIED: "text-destructive",
};

export default function VisitorHistory() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isDefaultList, setIsDefaultList] = useState(true);
  const [searching, setSearching] = useState(true);
  const [selected, setSelected] = useState<HistoryDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // With no query typed yet, load people with the most recent check-in
  // activity by default — so this page shows something right away,
  // the same way Who's Inside does, instead of requiring a search first.
  useEffect(() => {
    let active = true;
    let timeout: ReturnType<typeof setTimeout>;
    (async () => {
      await Promise.resolve();
      if (!active) return;
      setSearching(true);
      timeout = setTimeout(async () => {
        try {
          const res = await fetch(
            `/api/staff/security/history?q=${encodeURIComponent(query.trim())}`,
          );
          if (!res.ok || !active) return;
          const data = await res.json();
          if (active) {
            setResults(data.results);
            setIsDefaultList(data.isDefault);
          }
        } finally {
          if (active) setSearching(false);
        }
      }, 300);
    })();
    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [query]);

  async function selectPerson(id: string) {
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/staff/security/history/${id}`);
      if (!res.ok) return;
      const data = await res.json();
      setSelected(data);
    } finally {
      setLoadingDetail(false);
    }
  }

  if (selected) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setSelected(null)}
          className="text-muted-foreground hover:text-foreground flex items-center gap-2 text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to search
        </button>

        <div className="border-border bg-card flex items-center gap-3 rounded-lg border p-4">
          <div className="bg-muted flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
            {selected.registration.type === "CONTRACTOR" ? (
              <HardHat className="text-muted-foreground h-5 w-5" />
            ) : (
              <User className="text-muted-foreground h-5 w-5" />
            )}
          </div>
          <div>
            <p className="font-semibold">{selected.registration.fullName}</p>
            <p className="text-muted-foreground text-sm">
              {selected.registration.company}
            </p>
          </div>
        </div>

        {selected.visits.length === 0 ? (
          <p className="text-muted-foreground py-16 text-center text-sm">
            No visit history for this person yet.
          </p>
        ) : (
          <div className="space-y-3">
            {selected.visits.map((v) => (
              <div key={v.id} className="border-border rounded-lg border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{v.purpose}</p>
                    <p className="text-muted-foreground text-sm">
                      {formatDateWIB(v.visitDate)}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
                      VISIT_STATUS_STYLE[v.status],
                    )}
                  >
                    {v.status}
                  </span>
                </div>

                {v.authorizedZones.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {v.authorizedZones.map((z) => (
                      <span
                        key={z}
                        className="bg-muted rounded-full px-2 py-0.5 text-xs"
                      >
                        {z}
                      </span>
                    ))}
                  </div>
                )}

                {v.checkEvents.length > 0 && (
                  <div className="border-border mt-3 space-y-2 border-t pt-3">
                    {v.checkEvents.map((e, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between text-sm"
                      >
                        <span
                          className={cn(
                            "flex items-center gap-1.5 font-medium",
                            CHECK_STATUS_STYLE[e.status],
                          )}
                        >
                          {e.isOverride && (
                            <ShieldAlert className="h-3.5 w-3.5" />
                          )}
                          {e.status.charAt(0) + e.status.slice(1).toLowerCase()}
                          {e.riskLevel && ` · ${e.riskLevel} risk`}
                        </span>
                        <span className="text-muted-foreground text-xs">
                          {formatTimeWIB(e.checkInAt)}
                          {e.checkOutAt && ` – ${formatTimeWIB(e.checkOutAt)}`}
                        </span>
                      </div>
                    ))}
                    {v.checkEvents.some((e) => e.overrideJustification) && (
                      <p className="text-muted-foreground text-xs italic">
                        {
                          v.checkEvents.find((e) => e.overrideJustification)
                            ?.overrideJustification
                        }
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative w-full max-w-sm">
        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or company..."
          className="pl-9"
        />
      </div>

      {loadingDetail ? (
        <p className="text-muted-foreground py-8 text-center text-sm">
          Loading history...
        </p>
      ) : searching ? (
        <p className="text-muted-foreground py-8 text-center text-sm">
          {isDefaultList ? "Loading recent activity..." : "Searching..."}
        </p>
      ) : results.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center text-sm">
          {isDefaultList
            ? "No check-in activity recorded yet."
            : "No matches found."}
        </p>
      ) : (
        <div className="space-y-2">
          <p className="text-muted-foreground text-xs font-semibold uppercase">
            {isDefaultList ? "Recent activity" : "Search results"}
          </p>
          <div className="border-border max-h-[28rem] overflow-y-auto rounded-lg border">
          {results.map((r, i) => (
            <button
              key={r.id}
              onClick={() => selectPerson(r.id)}
              className={cn(
                "hover:bg-muted/40 flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm transition-colors",
                i % 2 === 1 && "bg-muted/20",
              )}
            >
              <div className="flex items-center gap-2">
                {r.type === "CONTRACTOR" ? (
                  <HardHat className="text-muted-foreground h-4 w-4" />
                ) : (
                  <User className="text-muted-foreground h-4 w-4" />
                )}
                <div>
                  <p className="font-medium">{r.fullName}</p>
                  <p className="text-muted-foreground text-xs">{r.company}</p>
                </div>
              </div>
              <ChevronRight className="text-muted-foreground h-4 w-4" />
            </button>
          ))}
          </div>
        </div>
      )}
    </div>
  );
}
