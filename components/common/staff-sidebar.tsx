"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  ClipboardList,
  CalendarCheck,
  ShieldBan,
  LogOut,
  ShieldCheck,
  LayoutDashboard,
  Bell,
  FileCheck,
  Users,
  BookOpen,
} from "lucide-react";
import { Button } from "../ui/button";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/staff/overview", icon: LayoutDashboard },
  { label: "Registrations", href: "/staff/registrations", icon: ClipboardList },
  { label: "Visit Approvals", href: "/staff/visits", icon: CalendarCheck },
  { label: "Document Expiry", href: "/staff/document-expiry", icon: FileCheck },
  { label: "Who's Inside", href: "/staff/whos-inside", icon: Users },
  { label: "Blacklist", href: "/staff/blacklist", icon: ShieldBan },
  { label: "Notification", href: "/staff/notifications", icon: Bell },
  { label: "Guide", href: "/staff/guide", icon: BookOpen },
];

export default function StaffSidebar({
  staffName,
  staffRole,
}: {
  staffName: string;
  staffRole: string;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/staff/logout", { method: "POST" });
    router.push("/internal/staff/login");
    router.refresh();
  }

  return (
    <aside className="border-border bg-card flex h-svh w-64 flex-col border-r">
      <div className="border-border flex items-center gap-2 border-b px-5 py-4">
        <div className="bg-primary/10 flex h-9 w-9 items-center justify-center rounded-lg">
          <ShieldCheck className="text-primary h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-semibold">SecureGate</p>
          <p className="text-muted-foreground text-xs">
            {staffRole.replace("_", " ")}
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>

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
              {staffRole.replace("_", " ")}
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
