"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import CustomDialog from "@/components/common/c-dialog";
import { CheckIcon, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";

interface Zone {
  id: string;
  name: string;
  riskLevel: string;
}

const RISK_STYLE: Record<string, string> = {
  LOW: "border-success-border text-success bg-success-muted",
  MEDIUM: "border-info-border text-info bg-info-muted",
  HIGH: "border-destructive-border text-destructive bg-destructive-muted",
  CRITICAL: "border-destructive-border text-destructive bg-destructive-muted",
};

export default function EditVisitZones({
  visitId,
  zones,
  currentZoneIds,
}: {
  visitId: string;
  zones: Zone[];
  currentZoneIds: string[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selectedZones, setSelectedZones] = useState<string[]>(currentZoneIds);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleOpenChange(next: boolean) {
    if (loading) return;
    setOpen(next);
    if (next) {
      setSelectedZones(currentZoneIds);
      setError(null);
    }
  }

  function toggleZone(id: string) {
    setError(null);
    setSelectedZones((prev) =>
      prev.includes(id) ? prev.filter((z) => z !== id) : [...prev, id],
    );
  }

  async function handleSave() {
    setError(null);
    if (selectedZones.length === 0) {
      setError("Please assign at least one zone.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/staff/visits/${visitId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "UPDATE_ZONES", zones: selectedZones }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? "Failed to update zones");
        return;
      }
      setOpen(false);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <CustomDialog
      open={open}
      onOpenChange={handleOpenChange}
      title="Edit authorized zones"
      description="Select the zones this person is allowed to access on this visit."
      className="max-w-xl!"
      trigger={
        <Button
          variant="ghost"
          size="sm"
          className="text-success hover:bg-success/15 hover:text-success cursor-pointer gap-1.5"
        >
          <Pencil className="h-3.5 w-3.5" />
          Edit zones
        </Button>
      }
    >
      <div className="space-y-4">
        <div className="grid max-h-80 grid-cols-2 gap-3 overflow-y-auto p-0.5 sm:grid-cols-3">
          {zones.map((zone) => {
            const selected = selectedZones.includes(zone.id);
            return (
              <button
                key={zone.id}
                type="button"
                onClick={() => toggleZone(zone.id)}
                disabled={loading}
                aria-pressed={selected}
                className={cn(
                  "flex cursor-pointer flex-col items-start gap-1 rounded-lg border p-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-60",
                  selected
                    ? "border-primary bg-primary/5 ring-primary/30 ring-1"
                    : "border-border hover:border-primary/40",
                )}
              >
                <div className="flex w-full items-center justify-between">
                  <span
                    className={cn(
                      "flex h-4 w-4 items-center justify-center rounded border",
                      selected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border",
                    )}
                  >
                    {selected && <CheckIcon className="h-3 w-3" />}
                  </span>
                  <span
                    className={`rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${RISK_STYLE[zone.riskLevel]}`}
                  >
                    {zone.riskLevel}
                  </span>
                </div>
                <span className="text-sm font-medium">{zone.name}</span>
              </button>
            );
          })}
        </div>

        <div className="border-border flex items-center justify-between border-t pt-3">
          <p className="text-muted-foreground text-xs">
            <span className="text-foreground font-medium">
              {selectedZones.length}
            </span>{" "}
            {selectedZones.length === 1 ? "zone" : "zones"} selected
          </p>
          {error && <p className="text-destructive text-xs">{error}</p>}
        </div>

        <div className="flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            disabled={loading}
            onClick={() => setOpen(false)}
            className="cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={loading}
            onClick={handleSave}
            className="cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </div>
    </CustomDialog>
  );
}
