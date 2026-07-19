"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Bell,
  ShieldX,
  CheckCircle2,
  XCircle,
  MessageSquare,
  CalendarClock,
  Clock,
  FileWarning,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
}

const TYPE_ICON: Record<
  string,
  { icon: React.ElementType; className: string; label: string }
> = {
  REGISTRATION_APPROVED: {
    icon: CheckCircle2,
    className: "bg-success-muted text-success",
    label: "Approved",
  },
  REGISTRATION_REJECTED: {
    icon: XCircle,
    className: "bg-destructive-muted text-destructive",
    label: "Rejected",
  },
  BLACKLIST_ALERT: {
    icon: ShieldX,
    className: "bg-destructive-muted text-destructive",
    label: "Blacklist",
  },
  TELEGRAM_MESSAGE: {
    icon: MessageSquare,
    className: "bg-muted text-muted-foreground",
    label: "Telegram",
  },
  DOCUMENT_EXPIRY: {
    icon: FileWarning,
    className: "bg-info-muted text-info",
    label: "Expiry",
  },
  OVERSTAY_ALERT: {
    icon: Clock,
    className: "bg-info-muted text-info",
    label: "Overstay",
  },
  VISIT_REQUEST: {
    icon: CalendarClock,
    className: "bg-info-muted text-info",
    label: "Visit",
  },
};

const FILTERS = [
  { value: "ALL", label: "All" },
  { value: "BLACKLIST_ALERT", label: "Blacklist" },
  { value: "REGISTRATION_APPROVED", label: "Approved" },
  { value: "REGISTRATION_REJECTED", label: "Rejected" },
  { value: "VISIT_REQUEST", label: "Visit" },
  { value: "OVERSTAY_ALERT", label: "Overstay" },
];

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function NotificationCenter() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [type, setType] = useState("ALL");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  // debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    let active = true;

    async function load() {
      // setLoading dipanggil di dalam async function, tapi masih sinkron di await pertama
      // trik: await microtask dulu biar keluar dari sync effect body
      await Promise.resolve();
      if (!active) return;

      setLoading(true);
      try {
        const params = new URLSearchParams({
          type,
          page: String(page),
        });
        if (debouncedSearch) params.set("q", debouncedSearch);

        const res = await fetch(`/api/staff/notifications/all?${params}`);
        if (!res.ok || !active) return;
        const data = await res.json();
        if (!active) return;

        setItems(data.notifications);
        setTotalPages(data.totalPages);
        setTotal(data.total);
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [type, page, debouncedSearch]);

  return (
    <div className="space-y-4">
      {/* Filter tabs */}
      <div className="border-border flex flex-wrap gap-1 border-b">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => {
              setType(f.value);
              setPage(1);
            }}
            className={cn(
              "relative px-4 py-2 text-sm font-medium transition-colors",
              type === f.value
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {f.label}
            {type === f.value && (
              <span className="bg-primary absolute inset-x-0 -bottom-px h-0.5" />
            )}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search notifications..."
          className="border-border rounded-md border pl-9"
        />
      </div>

      {/* List */}
      {loading ? (
        <p className="text-muted-foreground py-16 text-center text-sm">
          Loading...
        </p>
      ) : items.length === 0 ? (
        <div className="text-muted-foreground border-border flex flex-col items-center gap-2 rounded-lg border border-dashed py-16 text-center">
          <Bell className="h-8 w-8 opacity-40" />
          <p className="text-sm">No notifications found.</p>
        </div>
      ) : (
        <div className="border-border divide-border divide-y overflow-hidden rounded-lg border">
          {items.map((n) => {
            const cfg = TYPE_ICON[n.type] ?? {
              icon: Bell,
              className: "bg-muted text-muted-foreground",
              label: n.type,
            };
            const Icon = cfg.icon;
            return (
              <div
                key={n.id}
                className={cn(
                  "flex gap-3 px-4 py-3",
                  !n.isRead && "bg-primary/5",
                )}
              >
                <div
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                    cfg.className,
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{n.title}</p>
                    <span className="text-muted-foreground bg-muted rounded-full px-1.5 py-0.5 text-[10px]">
                      {cfg.label}
                    </span>
                    {!n.isRead && (
                      <span className="bg-primary h-1.5 w-1.5 rounded-full" />
                    )}
                  </div>
                  <p className="text-muted-foreground mt-0.5 text-sm">
                    {n.message}
                  </p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    {formatDateTime(n.createdAt)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-sm">
            {total} notification{total !== 1 ? "s" : ""} · page {page} of{" "}
            {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
              Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="cursor-pointer"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
