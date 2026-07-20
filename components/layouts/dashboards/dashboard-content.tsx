"use client";

import Link from "next/link";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ClipboardList,
  Clock,
  CheckCircle2,
  XCircle,
  CalendarClock,
  DoorOpen,
  ArrowRight,
  HardHat,
  User,
} from "lucide-react";
import ZoneOccupancy from "./zone-occupancy";

interface Stats {
  totalRegistrations: number;
  pendingRegistrations: number;
  approvedRegistrations: number;
  rejectedRegistrations: number;
  pendingVisits: number;
  activeVisitsToday: number;
}

interface TrendPoint {
  date: string;
  count: number;
}

interface RecentItem {
  id: string;
  fullName: string;
  company: string;
  type: "CONTRACTOR" | "VISITOR";
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
}

interface ZonePerson {
  id: string;
  fullName: string;
  company: string;
  type: string;
}

interface Zone {
  id: string;
  name: string;
  riskLevel: string;
}

const STATUS_STYLE: Record<string, string> = {
  PENDING: "border-info-border text-info bg-info-muted",
  APPROVED: "border-success-border text-success bg-success-muted",
  REJECTED: "border-destructive text-destructive bg-destructive-muted",
};

function formatShortDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
  });
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
  href,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  accent?: string;
  href?: string;
}) {
  const card = (
    <div className="border-border bg-card hover:border-primary/40 flex items-center justify-between rounded-xl border p-5 transition-colors">
      <div>
        <p className="text-muted-foreground text-sm">{label}</p>
        <p className="mt-1 text-3xl font-semibold">{value}</p>
      </div>
      <div
        className={`flex h-11 w-11 items-center justify-center rounded-lg ${
          accent ?? "bg-muted text-muted-foreground"
        }`}
      >
        <Icon className="h-5 w-5" />
      </div>
    </div>
  );

  return href ? <Link href={href}>{card}</Link> : card;
}

export default function DashboardContent({
  role,
  stats,
  trend,
  recent,
  zones,
  zoneOccupancy,
}: {
  role: string;
  stats: Stats;
  trend: TrendPoint[];
  recent: RecentItem[];
  zones: Zone[];
  zoneOccupancy: Record<string, ZonePerson[]>;
}) {
  const roleLabel = role === "HSE_ADMIN" ? "HSE" : "HR";

  return (
    <div className="space-y-8 p-8">
      <div>
        <h1 className="text-2xl font-semibold">{roleLabel} Dashboard</h1>
        <p className="text-muted-foreground text-sm">
          Overview of registrations and visit activity.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Pending review"
          value={stats.pendingRegistrations}
          icon={Clock}
          accent="bg-info-muted text-info"
          href="/staff/registrations"
        />
        <StatCard
          label="Total registrations"
          value={stats.totalRegistrations}
          icon={ClipboardList}
        />
        <StatCard
          label="Approved"
          value={stats.approvedRegistrations}
          icon={CheckCircle2}
          accent="bg-success-muted text-success"
        />
        <StatCard
          label="Rejected"
          value={stats.rejectedRegistrations}
          icon={XCircle}
          accent="bg-destructive-muted text-destructive"
        />
        <StatCard
          label="Visit requests pending"
          value={stats.pendingVisits}
          icon={CalendarClock}
          accent="bg-info-muted text-info"
          href="/staff/visits"
        />
        <StatCard
          label="Active visits today"
          value={stats.activeVisitsToday}
          icon={DoorOpen}
          accent="bg-primary/10 text-primary"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="border-border bg-card rounded-xl border p-6">
          <div className="mb-4">
            <h2 className="font-semibold">Registrations this week</h2>
            <p className="text-muted-foreground text-sm">
              New registrations over the last 7 days
            </p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={trend}
                margin={{ top: 8, right: 8, bottom: 0, left: -20 }}
              >
                <defs>
                  <linearGradient id="fillTrend" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="0%"
                      stopColor="var(--primary)"
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="100%"
                      stopColor="var(--primary)"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  tickFormatter={formatShortDate}
                  tick={{ fontSize: 12 }}
                  stroke="var(--muted-foreground)"
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 12 }}
                  stroke="var(--muted-foreground)"
                  tickLine={false}
                  axisLine={false}
                  width={40}
                />
                <Tooltip
                  labelFormatter={(v) => formatShortDate(v as string)}
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid var(--border)",
                    background: "var(--card)",
                    fontSize: 13,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="var(--primary)"
                  strokeWidth={2}
                  fill="url(#fillTrend)"
                  name="Registrations"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="border-border bg-card rounded-xl border p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Recent registrations</h2>
            <Link
              href="/staff/registrations"
              className="text-primary inline-flex items-center gap-1 text-sm hover:underline"
            >
              View all
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {recent.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center text-sm">
              No registrations yet.
            </p>
          ) : (
            <ul className="space-y-3">
              {recent.map((r) => (
                <li key={r.id}>
                  <Link
                    href={`/staff/registrations/${r.id}`}
                    className="hover:bg-muted/40 -mx-2 flex items-center gap-3 rounded-lg px-2 py-2 transition-colors"
                  >
                    <div className="bg-muted flex h-9 w-9 shrink-0 items-center justify-center rounded-full">
                      {r.type === "CONTRACTOR" ? (
                        <HardHat className="text-muted-foreground h-4 w-4" />
                      ) : (
                        <User className="text-muted-foreground h-4 w-4" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {r.fullName}
                      </p>
                      <p className="text-muted-foreground truncate text-xs">
                        {r.company} · {relativeTime(r.createdAt)}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[r.status]}`}
                    >
                      {r.status}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <ZoneOccupancy zones={zones} occupancy={zoneOccupancy} />
    </div>
  );
}
