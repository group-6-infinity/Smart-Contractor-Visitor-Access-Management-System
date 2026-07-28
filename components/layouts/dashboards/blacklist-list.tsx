"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShieldX, ShieldCheck, ExternalLink } from "lucide-react";
import { formatDateWIB } from "@/lib/datetime";
import BlacklistAddDialog from "@/components/layouts/dashboards/blacklist-add-dialog";

interface BlacklistEntry {
  id: string;
  fullName: string;
  email: string;
  reason: string;
  registrationId: string | null;
  createdAt: string;
}

export default function BlacklistList({
  initialEntries,
}: {
  initialEntries: BlacklistEntry[];
}) {
  const [entries, setEntries] = useState<BlacklistEntry[]>(initialEntries);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function handleRemove(id: string) {
    setLoadingId(id);
    try {
      const res = await fetch("/api/staff/blacklist", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setEntries((prev) => prev.filter((e) => e.id !== id));
      }
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <BlacklistAddDialog
          onAdded={(entry) => setEntries((prev) => [entry, ...prev])}
        />
      </div>

      {entries.length === 0 ? (
        <div className="text-muted-foreground border-border flex flex-col items-center gap-2 rounded-lg border border-dashed py-16 text-center">
          <ShieldX className="h-8 w-8 opacity-40" />
          <p className="text-sm">No one is blacklisted.</p>
        </div>
      ) : (
        <div className="border-border overflow-hidden rounded-lg border">
          <div className="bg-muted text-muted-foreground grid grid-cols-[1.5fr_1.5fr_2fr_1fr_auto] gap-4 px-4 py-3 text-xs font-semibold uppercase">
            <span>Name</span>
            <span>Email</span>
            <span>Reason</span>
            <span>Added</span>
            <span></span>
          </div>
          {entries.map((e, i) => (
            <div
              key={e.id}
              className={`grid grid-cols-[1.5fr_1.5fr_2fr_1fr_auto] items-center gap-4 px-4 py-3 text-sm ${
                i % 2 === 1 ? "bg-muted/20" : ""
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="font-medium">{e.fullName}</span>
                {e.registrationId && (
                  <Link
                    href={`/staff/registrations/${e.registrationId}`}
                    className="text-muted-foreground hover:text-primary"
                    aria-label="View registration"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                )}
              </div>
              <span className="text-muted-foreground truncate">{e.email}</span>
              <span className="text-muted-foreground truncate">{e.reason}</span>
              <span className="text-muted-foreground text-xs">
                {formatDateWIB(e.createdAt)}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={loadingId === e.id}
                onClick={() => handleRemove(e.id)}
                className="cursor-pointer"
              >
                <ShieldCheck className="mr-1 h-3.5 w-3.5" />
                {loadingId === e.id ? "..." : "Remove"}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
