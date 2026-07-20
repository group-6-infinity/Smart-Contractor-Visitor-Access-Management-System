"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CheckIcon, XIcon, AlertCircle, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

interface Zone {
  id: string;
  name: string;
  riskLevel: string;
}

const RISK_STYLE: Record<string, string> = {
  LOW: "border-success-border text-success bg-success-muted",
  MEDIUM: "border-info-border text-info bg-info-muted",
  HIGH: "border-destructive text-destructive bg-destructive-muted",
  CRITICAL: "border-destructive text-destructive bg-destructive-muted",
};

export default function VisitReviewActions({
  visitId,
  zones,
}: {
  visitId: string;
  zones: Zone[];
}) {
  const router = useRouter();
  const [selectedZones, setSelectedZones] = useState<string[]>([]);
  const [rejecting, setRejecting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleZone(id: string) {
    setError(null);
    setSelectedZones((prev) =>
      prev.includes(id) ? prev.filter((z) => z !== id) : [...prev, id]
    );
  }

  async function submit(action: "APPROVE" | "REJECT") {
    setError(null);

    if (action === "APPROVE" && selectedZones.length === 0) {
      setError("Please assign at least one zone before approving.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/staff/visits/${visitId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          zones: action === "APPROVE" ? selectedZones : [],
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? "Action failed");
        return;
      }
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="border-border space-y-4 rounded-lg border p-4">
      {!rejecting && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <MapPin className="text-muted-foreground h-4 w-4" />
            <p className="text-sm font-medium">Assign authorized zones</p>
          </div>
          <p className="text-muted-foreground text-xs">
            Select the zones this person is allowed to access. Required before
            approving.
          </p>

          <div className="grid grid-cols-2 gap-2 pt-1 sm:grid-cols-3">
            {zones.map((zone) => {
              const selected = selectedZones.includes(zone.id);
              return (
                <button
                  key={zone.id}
                  type="button"
                  onClick={() => toggleZone(zone.id)}
                  disabled={loading}
                  className={cn(
                    "flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-colors",
                    selected
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/40"
                  )}
                >
                  <div className="flex w-full items-center justify-between">
                    <span
                      className={cn(
                        "flex h-4 w-4 items-center justify-center rounded border",
                        selected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border"
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
        </div>
      )}

      {rejecting && (
        <p className="text-muted-foreground text-sm">
          Are you sure you want to reject this visit request?
        </p>
      )}

      {error && <p className="text-destructive text-sm">{error}</p>}

      <div className="flex items-center justify-end gap-3">
        {!rejecting ? (
          <>
            <Button
              variant="outline"
              disabled={loading}
              onClick={() => setRejecting(true)}
              className="text-destructive cursor-pointer"
            >
              <XIcon className="mr-1 h-4 w-4" />
              Reject
            </Button>
            <Button
              disabled={loading || selectedZones.length === 0}
              onClick={() => submit("APPROVE")}
              className="bg-success text-success-foreground hover:bg-success/90 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
            >
              <CheckIcon className="mr-1 h-4 w-4" />
              {loading ? "Approving..." : "Approve"}
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="outline"
              disabled={loading}
              onClick={() => {
                setRejecting(false);
                setError(null);
              }}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              disabled={loading}
              onClick={() => submit("REJECT")}
              className="bg-destructive cursor-pointer text-white hover:bg-destructive/90"
            >
              {loading ? "Rejecting..." : "Confirm rejection"}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
