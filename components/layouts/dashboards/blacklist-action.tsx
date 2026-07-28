"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ShieldX, ShieldCheck } from "lucide-react";
import CustomDialog from "@/components/common/c-dialog";

interface Props {
  registrationId: string;
  fullName: string;
  isBlacklisted: boolean;
  blacklistId?: string;
  blacklistReason?: string;
}

export default function BlacklistAction({
  registrationId,
  fullName,
  isBlacklisted,
  blacklistId,
  blacklistReason,
}: Props) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  async function handleBlacklist() {
    setError(null);
    if (!reason.trim()) {
      setError("Please provide a reason.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/staff/blacklist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationId, reason }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? "Failed to blacklist");
        return;
      }
      setOpen(false);
      router.refresh();
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function handleUnblacklist() {
    setLoading(true);
    try {
      const res = await fetch("/api/staff/blacklist", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: blacklistId }),
      });
      if (res.ok) router.refresh();
    } finally {
      setLoading(false);
    }
  }

  // Sudah di-blacklist → tampilkan status + tombol unblacklist
  if (isBlacklisted) {
    return (
      <div className="border-destructive-border bg-destructive-muted flex items-start justify-between gap-4 rounded-lg border p-4">
        <div className="flex items-start gap-2">
          <ShieldX className="text-destructive mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="text-destructive text-sm font-semibold">
              This person is blacklisted
            </p>
            {blacklistReason && (
              <p className="text-destructive/80 mt-0.5 text-sm">
                Reason: {blacklistReason}
              </p>
            )}
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={loading}
          onClick={handleUnblacklist}
          className="shrink-0 cursor-pointer"
        >
          <ShieldCheck className="mr-1 h-4 w-4" />
          {loading ? "..." : "Remove"}
        </Button>
      </div>
    );
  }

  // Belum → tombol blacklist (buka modal minta reason)
  return (
    <CustomDialog
      open={open}
      onOpenChange={setOpen}
      title="Blacklist this person"
      trigger={
        <Button
          size="lg"
          variant="outline"
          className="text-destructive hover:bg-destructive-muted w-full cursor-pointer py-6"
        >
          <ShieldX className="mr-1 h-4 w-4" />
          Blacklist this person
        </Button>
      }
    >
      <div className="space-y-4">
        <p className="text-muted-foreground text-sm">
          You are about to blacklist <strong>{fullName}</strong>. They will be
          automatically denied at check-in with no operator override, and cannot
          submit a new registration.
        </p>
        <p className="text-muted-foreground text-sm">
          Any of their registrations still pending or approved will be{" "}
          <strong>rejected automatically</strong> — including a second
          registration of the other type, if they have one.
        </p>

        <textarea
          value={reason}
          onChange={(e) => {
            setReason(e.target.value);
            setError(null);
          }}
          disabled={loading}
          rows={3}
          placeholder="Reason for blacklisting (e.g. repeated safety violations, falsified documents)..."
          className="border-border bg-input/50 focus-visible:ring-ring/30 w-full rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-3"
        />

        {error && <p className="text-destructive text-sm">{error}</p>}

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setOpen(false);
              setError(null);
            }}
            disabled={loading}
            className="cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            onClick={handleBlacklist}
            disabled={loading || !reason.trim()}
            className="bg-destructive hover:bg-destructive/90 cursor-pointer text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Blacklisting..." : "Confirm blacklist"}
          </Button>
        </div>
      </div>
    </CustomDialog>
  );
}
