"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, ArrowLeft } from "lucide-react";
import CustomDialog from "@/components/common/c-dialog";

interface RegistrationHit {
  id: string;
  fullName: string;
  company: string;
  email: string;
  type: string;
  status: string;
}

interface BlacklistEntry {
  id: string;
  fullName: string;
  email: string;
  reason: string;
  registrationId: string | null;
  createdAt: string;
}

export default function BlacklistAddDialog({
  onAdded,
}: {
  onAdded: (entry: BlacklistEntry) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<RegistrationHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<RegistrationHit | null>(null);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounced search-as-you-type — only fires while a name isn't picked yet.
  // Nothing here runs synchronously in the effect body itself; an empty
  // query is handled by rendering `trimmedQuery ? results : []` below rather
  // than clearing state from the effect.
  const trimmedQuery = query.trim();
  useEffect(() => {
    if (selected || !trimmedQuery) return;
    const handle = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `/api/staff/registrations?q=${encodeURIComponent(trimmedQuery)}`,
        );
        const data = await res.json();
        setResults(res.ok ? data.registrations : []);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(handle);
  }, [trimmedQuery, selected]);

  function reset() {
    setQuery("");
    setResults([]);
    setSelected(null);
    setReason("");
    setError(null);
  }

  async function handleSubmit() {
    if (!selected || !reason.trim()) {
      setError("Please provide a reason.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/staff/blacklist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationId: selected.id, reason }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? "Failed to add");
        return;
      }
      onAdded(data.entry);
      setOpen(false);
      reset();
    } catch {
      setError("Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <CustomDialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
      title="Blacklist someone"
      trigger={
        <Button className="cursor-pointer font-semibold">
          <Plus className="mr-1 h-4 w-4" />
          Add to blacklist
        </Button>
      }
    >
      <div className="space-y-4">
        {!selected ? (
          <>
            <p className="text-muted-foreground text-sm">
              Search by name, email, or company. You can only blacklist a person
              who has an existing registration. That confirms their identity
              against their submitted documents.
            </p>
            <div className="relative">
              <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <Input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search registrations..."
                className="w-full pl-9"
              />
            </div>

            <div className="max-h-72 space-y-1 overflow-y-auto">
              {searching && (
                <p className="text-muted-foreground py-6 text-center text-sm">
                  Searching...
                </p>
              )}
              {!searching && trimmedQuery && results.length === 0 && (
                <p className="text-muted-foreground py-6 text-center text-sm">
                  No registrations found.
                </p>
              )}
              {!searching &&
                trimmedQuery &&
                results.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setSelected(r)}
                    className="border-border hover:bg-muted/40 flex w-full cursor-pointer flex-col items-start gap-0.5 rounded-md border p-3 text-left transition-colors"
                  >
                    <span className="font-medium">{r.fullName}</span>
                    <span className="text-muted-foreground text-xs">
                      {r.company} · {r.email} · {r.type}
                    </span>
                  </button>
                ))}
            </div>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="text-muted-foreground hover:text-foreground flex cursor-pointer items-center gap-1.5 text-sm"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Choose someone else
            </button>

            <div className="border-border rounded-md border p-3">
              <p className="font-medium">{selected.fullName}</p>
              <p className="text-muted-foreground text-xs">
                {selected.company} · {selected.email}
              </p>
            </div>

            <p className="text-muted-foreground text-sm">
              You are about to blacklist <strong>{selected.fullName}</strong>.
              They will be automatically denied at check-in with no operator
              override, and cannot submit a new registration.
            </p>
            <p className="text-muted-foreground text-sm">
              Any of their registrations still pending or approved will be{" "}
              <strong>rejected automatically</strong> — including a second
              registration of the other type, if they have one. Open visit
              requests are cancelled along with them.
            </p>

            <textarea
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setError(null);
              }}
              disabled={submitting}
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
                  reset();
                }}
                disabled={submitting}
                className="cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={submitting || !reason.trim()}
                className="bg-destructive hover:bg-destructive/90 cursor-pointer text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? "Blacklisting..." : "Confirm blacklist"}
              </Button>
            </div>
          </>
        )}

        {!selected && error && (
          <p className="text-destructive text-sm">{error}</p>
        )}
      </div>
    </CustomDialog>
  );
}
