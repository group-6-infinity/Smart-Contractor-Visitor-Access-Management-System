"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import CustomDialog from "@/components/common/c-dialog";
import { CheckCircle2 } from "lucide-react";

export default function DocumentVerifyAction({
  docId,
  docType,
  apiPath,
  onDone,
}: {
  docId: string;
  docType: string;
  // path API verify, mis: `/api/staff/documents/${docId}/verify-reupload`
  apiPath: string;
  onDone: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [expiry, setExpiry] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const today = new Date().toISOString().slice(0, 10);
  const isValid = expiry !== "" && expiry > today;

  async function handleVerify() {
    setError(null);
    if (!isValid) {
      setError("Expiry date must be a future date.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(apiPath, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          expiryDate: expiry,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? "Verify failed");
        return;
      }
      setOpen(false);
      onDone();
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <CustomDialog
      open={open}
      onOpenChange={setOpen}
      title={`Verify ${docType}`}
      trigger={
        <button className="text-success inline-flex cursor-pointer items-center gap-1 text-xs font-medium hover:underline">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Verify
        </button>
      }
    >
      <div className="space-y-4">
        <p className="text-muted-foreground text-sm">
          Set the expiry date for this document. Once verified, the person
          can submit visit requests.
        </p>
        <div className="space-y-1">
          <label className="text-muted-foreground text-sm">
            Expiry date <span className="text-destructive">*</span>
          </label>
          <Input
            type="date"
            value={expiry}
            min={today}
            onChange={(e) => {
              setExpiry(e.target.value);
              setError(null);
            }}
            disabled={loading}
            className="border-border rounded-md border [&::-webkit-calendar-picker-indicator]:invert"
          />
        </div>

        {error && <p className="text-destructive text-sm">{error}</p>}

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={loading}
            className="cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            onClick={handleVerify}
            disabled={loading || !isValid}
            className="cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Verifying..." : "Verify & Set Expiry"}
          </Button>
        </div>
      </div>
    </CustomDialog>
  );
}
