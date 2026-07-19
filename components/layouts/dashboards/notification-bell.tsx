"use client";

import { useEffect, useRef, useState } from "react";
import {
  Bell,
  ShieldX,
  CheckCircle2,
  XCircle,
  MessageSquare,
  CalendarClock,
  Clock,
  FileWarning,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

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
  { icon: React.ElementType; className: string }
> = {
  REGISTRATION_APPROVED: {
    icon: CheckCircle2,
    className: "bg-success-muted text-success",
  },
  REGISTRATION_REJECTED: {
    icon: XCircle,
    className: "bg-destructive-muted text-destructive",
  },
  BLACKLIST_ALERT: {
    icon: ShieldX,
    className: "bg-destructive-muted text-destructive",
  },
  TELEGRAM_MESSAGE: {
    icon: MessageSquare,
    className: "bg-muted text-muted-foreground",
  },
  DOCUMENT_EXPIRY: { icon: FileWarning, className: "bg-info-muted text-info" },
  OVERSTAY_ALERT: { icon: Clock, className: "bg-info-muted text-info" },
  VISIT_REQUEST: {
    icon: CalendarClock,
    className: "bg-info-muted text-info",
  },
};

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

const POLL_INTERVAL = 30000;

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;

    async function poll() {
      try {
        const res = await fetch("/api/staff/notifications");
        if (!res.ok || !active) return;
        const data = await res.json();
        if (!active) return;
        setItems(data.notifications);
        setUnread(data.unreadCount);
      } catch {
        // silent fail — don't disrupt UI on polling error
      }
    }

    poll();
    const interval = setInterval(poll, POLL_INTERVAL);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function handleOpen() {
    const next = !open;
    setOpen(next);
    if (next && unread > 0) {
      await fetch("/api/staff/notifications", { method: "POST" });
      setUnread(0);
      setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    }
  }

  return (
    <div className="relative" ref={ref}>
      <Button
        variant="ghost"
        onClick={handleOpen}
        className="hover:bg-muted relative flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg transition-colors"
        aria-label="Notifications"
      >
        <Bell className="text-muted-foreground h-5 w-5" />
        {unread > 0 && (
          <span className="bg-destructive absolute top-1.5 right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </Button>

      {open && (
        <div className="border-border bg-card absolute right-0 z-50 mt-2 w-96 overflow-hidden rounded-xl border shadow-lg">
          <div className="border-border border-b px-4 py-3">
            <h3 className="font-semibold">Notifications</h3>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <p className="text-muted-foreground px-4 py-8 text-center text-sm">
                No notifications yet.
              </p>
            ) : (
              items.map((n) => {
                const cfg = TYPE_ICON[n.type] ?? {
                  icon: Bell,
                  className: "bg-muted text-muted-foreground",
                };
                const Icon = cfg.icon;
                const expanded = expandedId === n.id;
                return (
                  <div
                    key={n.id}
                    className={cn(
                      "border-border flex gap-3 border-b px-4 py-3 last:border-b-0",
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
                      <p className="text-sm font-medium">{n.title}</p>
                      <p
                        className={cn(
                          "text-muted-foreground text-sm",
                          expanded ? "" : "truncate",
                        )}
                      >
                        {n.message}
                      </p>
                      {n.message.length > 40 && (
                        <Button
                          onClick={() => setExpandedId(expanded ? null : n.id)}
                          variant="ghost"
                          className="text-primary m-0! mt-0.5 cursor-pointer p-0! text-xs hover:underline hover:bg-transparent!"
                        >
                          {expanded ? "Show less" : "View"}
                        </Button>
                      )}
                      <p className="text-muted-foreground mt-0.5 text-xs">
                        {relativeTime(n.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
