"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CheckIcon, XIcon } from "lucide-react";

export default function RegistrationReviewActions({
  registrationId,
}: {
  registrationId: string;
}) {
  const router = useRouter();
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(action: "APPROVE" | "REJECT") {
    setError(null);

    if (action === "REJECT" && !reason.trim()) {
      setError("Please provide a rejection reason.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/staff/registrations/${registrationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, rejectionReason: reason }),
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
      {rejecting && (
        <div className="space-y-2">
          <label className="text-muted-foreground text-sm">
            Rejection reason
          </label>
          <textarea
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              setError(null);
            }}
            rows={3}
            placeholder="Explain why this registration is rejected..."
            className="border-border bg-input/50 focus-visible:ring-ring/30 w-full rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-3"
          />
        </div>
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
              disabled={loading}
              onClick={() => submit("APPROVE")}
              className="bg-success text-success-foreground hover:bg-success/90 cursor-pointer"
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
                setReason("");
                setError(null);
              }}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              disabled={loading}
              onClick={() => submit("REJECT")}
              className="bg-destructive text-white hover:bg-destructive/90 cursor-pointer"
            >
              {loading ? "Rejecting..." : "Confirm rejection"}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
