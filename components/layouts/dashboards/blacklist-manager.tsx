"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShieldX, Trash2, Plus } from "lucide-react";
import { formatDateWIB } from "@/lib/datetime";

interface BlacklistEntry {
  id: string;
  fullName: string;
  email: string;
  reason: string;
  createdAt: string;
}

export default function BlacklistManager({
  initialEntries,
}: {
  initialEntries: BlacklistEntry[];
}) {
  const [entries, setEntries] = useState<BlacklistEntry[]>(initialEntries);
  const [showForm, setShowForm] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = fullName.trim() && email.trim() && reason.trim();

  async function handleAdd() {
    setError(null);
    if (!canSubmit) return;

    setLoading(true);
    try {
      const res = await fetch("/api/staff/blacklist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, reason }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? "Failed to add");
        return;
      }
      setEntries((prev) => [data.entry, ...prev]);
      setFullName("");
      setEmail("");
      setReason("");
      setShowForm(false);
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRemove(id: string) {
    setLoading(true);
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
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          onClick={() => setShowForm((v) => !v)}
          className="cursor-pointer font-semibold"
        >
          <Plus className="mr-1 h-4 w-4" />
          Add to blacklist
        </Button>
      </div>

      {showForm && (
        <div className="border-border space-y-3 rounded-lg border p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-muted-foreground text-sm">Full name</label>
              <Input
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  setError(null);
                }}
                disabled={loading}
                placeholder="Full name"
                className="border-border rounded-md border"
              />
            </div>
            <div className="space-y-1">
              <label className="text-muted-foreground text-sm">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError(null);
                }}
                disabled={loading}
                placeholder="name@example.com"
                className="border-border rounded-md border"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-muted-foreground text-sm">Reason</label>
            <textarea
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setError(null);
              }}
              disabled={loading}
              rows={2}
              placeholder="Reason for blacklisting..."
              className="border-border bg-input/50 focus-visible:ring-ring/30 w-full rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-3"
            />
          </div>

          {error && <p className="text-destructive text-sm">{error}</p>}

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowForm(false);
                setError(null);
              }}
              disabled={loading}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAdd}
              disabled={loading || !canSubmit}
              className="cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Adding..." : "Add"}
            </Button>
          </div>
        </div>
      )}

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
              <span className="font-medium">{e.fullName}</span>
              <span className="text-muted-foreground truncate">{e.email}</span>
              <span className="text-muted-foreground truncate">{e.reason}</span>
              <span className="text-muted-foreground text-xs">
                {formatDateWIB(e.createdAt)}
              </span>
              <button
                onClick={() => handleRemove(e.id)}
                disabled={loading}
                className="text-muted-foreground hover:text-destructive cursor-pointer transition-colors disabled:opacity-50"
                aria-label="Remove"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
