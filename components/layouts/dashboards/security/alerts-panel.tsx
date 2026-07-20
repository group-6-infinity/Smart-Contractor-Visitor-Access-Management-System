"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, ShieldAlert, Ban, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface AlertItem {
  id: string;
  fullName: string;
  company: string;
  since?: string | null;
  checkInAt?: string;
  reason?: string | null;
  at?: string;
}

interface AlertsData {
  overstay: AlertItem[];
  highRisk: AlertItem[];
  denied: AlertItem[];
  summary: { overstay: number; highRisk: number; denied: number };
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AlertsPanel() {
  const [data, setData] = useState<AlertsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      await Promise.resolve();
      if (!active) return;
      try {
        const res = await fetch("/api/staff/checkin/alerts");
        if (!res.ok || !active) return;
        const d = await res.json();
        if (active) setData(d);
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    const interval = setInterval(load, 30000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

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
              meta={a.since ? `Window ended ${formatTime(a.since)}` : ""}
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
          data.highRisk.map((a) => (
            <AlertRow
              key={a.id}
              name={a.fullName}
              company={a.company}
              meta={a.checkInAt ? `Checked in ${formatTime(a.checkInAt)}` : ""}
              tone="primary"
            />
          ))
        )}
      </AlertSection>

      {/* Denied today */}
      <AlertSection
        title="Denied Entries Today"
        description="Entry attempts denied at the gate (incl. blacklist)"
        icon={Ban}
        accent="border-destructive text-destructive bg-destructive-muted"
        count={data.summary.denied}
      >
        {data.denied.length === 0 ? (
          <EmptyRow text="No denied entries today." />
        ) : (
          data.denied.map((a) => (
            <AlertRow
              key={a.id}
              name={a.fullName}
              company={a.company}
              meta={`${a.at ? formatTime(a.at) : ""}${a.reason ? ` · ${a.reason}` : ""}`}
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
              accent
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
          tone === "destructive" ? "text-destructive" : "text-primary"
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
