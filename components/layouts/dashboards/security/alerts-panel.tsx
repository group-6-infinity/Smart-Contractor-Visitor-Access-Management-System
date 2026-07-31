"use client";

import { useCallback, useState } from "react";
import { ShieldAlert, Ban, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatTimeWIB } from "@/lib/datetime";
import { usePulse } from "@/hooks/use-pulse";
import LiveIndicator from "@/components/common/live-indicator";

interface AlertItem {
  id: string;
  fullName: string;
  company: string;
  since?: string | null;
  checkInAt?: string;
  riskLevel?: string | null;
  reason?: string | null;
  at?: string;
}

interface AlertsData {
  overstay: AlertItem[];
  highRisk: AlertItem[];
  denied: AlertItem[];
  summary: { overstay: number; highRisk: number; denied: number };
}

export default function AlertsPanel() {
  const [data, setData] = useState<AlertsData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/staff/checkin/alerts", {
        cache: "no-store",
      });
      if (!res.ok) return;
      setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  usePulse("inside", load, { initial: true, maxStaleMs: 60000 });

  if (loading) {
    return (
      <p className="text-muted-foreground py-16 text-center text-sm">
        Loading...
      </p>
    );
  }
  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <LiveIndicator />
      </div>

      {/* Overstay */}
      <AlertSection
        title="Overstay"
        description="Visitors still inside past their visit window"
        icon={Clock}
        accent="border-destructive text-destructive bg-destructive-muted"
        count={data.summary.overstay}
      >
        {data.overstay.length === 0 ? (
          <EmptyRow text="No overstay visitors." />
        ) : (
          data.overstay.map((a) => (
            <AlertRow
              key={a.id}
              name={a.fullName}
              company={a.company}
              meta={a.since ? `Window ended ${formatTimeWIB(a.since)}` : ""}
              tone="destructive"
            />
          ))
        )}
      </AlertSection>

      {/* High Risk */}
      <AlertSection
        title="High Risk Inside"
        description="High-risk individuals currently inside"
        icon={ShieldAlert}
        accent="border-primary text-primary bg-primary/10"
        count={data.summary.highRisk}
      >
        {data.highRisk.length === 0 ? (
          <EmptyRow text="No high-risk visitors inside." />
        ) : (
          // Everything in this list is HIGH by definition — the endpoint filters
          // on it — so the tone is unconditional.
          data.highRisk.map((a) => (
            <AlertRow
              key={a.id}
              name={a.fullName}
              company={a.company}
              meta={[
                a.riskLevel,
                a.checkInAt ? `Checked in ${formatTimeWIB(a.checkInAt)}` : "",
              ]
                .filter(Boolean)
                .join(" · ")}
              tone="destructive"
            />
          ))
        )}
      </AlertSection>

      {/* Denied entries */}
      <AlertSection
        title="Recent Denied Entries"
        description="Last 20 entry attempts denied at the gate (incl. blacklist)"
        icon={Ban}
        accent="border-destructive text-destructive bg-destructive-muted"
        count={data.summary.denied}
      >
        {data.denied.length === 0 ? (
          <EmptyRow text="No denied entries." />
        ) : (
          data.denied.map((a) => (
            <AlertRow
              key={a.id}
              name={a.fullName}
              company={a.company}
              meta={`${a.at ? formatTimeWIB(a.at) : ""}${a.reason ? ` · ${a.reason}` : ""}`}
              tone="destructive"
            />
          ))
        )}
      </AlertSection>
    </div>
  );
}

function AlertSection({
  title,
  description,
  icon: Icon,
  accent,
  count,
  children,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  accent: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <div className="border-border overflow-hidden rounded-xl border">
      <div className="border-border flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-lg border",
              accent,
            )}
          >
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <p className="font-semibold">{title}</p>
            <p className="text-muted-foreground text-xs">{description}</p>
          </div>
        </div>
        <span className="text-2xl font-bold">{count}</span>
      </div>
      <div className="divide-border divide-y">{children}</div>
    </div>
  );
}

function AlertRow({
  name,
  company,
  meta,
  tone,
}: {
  name: string;
  company: string;
  meta: string;
  tone: "destructive" | "primary";
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <div>
        <p className="text-sm font-medium">{name}</p>
        <p className="text-muted-foreground text-xs">{company}</p>
      </div>
      <span
        className={cn(
          "text-xs",
          tone === "destructive" ? "text-destructive" : "text-primary",
        )}
      >
        {meta}
      </span>
    </div>
  );
}

function EmptyRow({ text }: { text: string }) {
  return (
    <p className="text-muted-foreground px-4 py-6 text-center text-sm">
      {text}
    </p>
  );
}
