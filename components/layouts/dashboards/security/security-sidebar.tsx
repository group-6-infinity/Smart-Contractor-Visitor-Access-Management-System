"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  ScanLine,
  Users,
  Bell,
  ShieldBan,
  LogOut,
  ShieldCheck,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const NAV = [
  {
    href: "/staff/security/checkin",
    label: "Check-In",
    icon: ScanLine,
  },
  {
    href: "/staff/security/roster",
    label: "Who's Inside",
    icon: Users,
  },
  {
    href: "/staff/security/alerts",
    label: "Alerts",
    icon: Bell,
  },
  {
    href: "/staff/security/blacklist",
    label: "Watchlist",
    icon: ShieldBan,
  },
  {
    href: "/staff/security/guide",
    label: "Guide",
    icon: BookOpen,
  },
];

export default function SecuritySidebar({ staffName }: { staffName: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/staff/logout", { method: "POST" });
    router.push("/internal/staff/login");
    router.refresh();
  }

  return (
    <aside className="border-border bg-card flex h-svh w-64 flex-col border-r">
      {/* Brand */}
      <div className="border-border flex items-center gap-2 border-b px-5 py-4">
        <div className="bg-primary/15 flex h-9 w-9 items-center justify-center rounded-lg">
          <ShieldCheck className="text-primary h-5 w-5" />
        </div>
        <div>
          <p className="text-sm leading-tight font-bold">SecureGate</p>
          <p className="text-primary text-xs font-medium">GATE A · Security</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 p-3">
        {NAV.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer — operator + logout */}
      <div className="border-border border-t p-3">
        <div className="staff__info flex items-center gap-2">
          <Button
            variant="ghost"
            className="border-border block aspect-square rounded-full border bg-transparent px-2! uppercase hover:bg-transparent!"
          >
            {staffName.slice(0, 2)}
          </Button>
          <div className="mb-2 px-3">
            <p className="truncate text-sm font-medium">{staffName}</p>
            <p className="text-muted-foreground truncate text-xs">
              Security Operator
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="text-muted-foreground hover:bg-muted hover:text-destructive flex w-full cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </div>
    </aside>
  );
}
