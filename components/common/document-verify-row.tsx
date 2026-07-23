"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle2, Circle, Eye, AlertTriangle } from "lucide-react";
import CustomDialog from "@/components/common/c-dialog";
import { cn } from "@/lib/utils";
import {
  getExpiryStatus,
  formatReadableDate,
  daysUntilExpiry,
} from "@/lib/document-status";

interface DocRow {
  id: string;
  type: string;
  isVerified: boolean;
  expiryDate: string | null;
}

const EXPIRY_BADGE_STYLE: Record<string, string> = {
  VALID: "border-success-border text-success bg-success-muted",
  EXPIRING_SOON: "border-info-border text-info bg-info-muted",
  EXPIRED: "border-destructive text-destructive bg-destructive-muted",
  NO_EXPIRY: "border-border text-muted-foreground bg-muted",
};

function expiryBadgeLabel(expiryDate: string | null) {
  const status = getExpiryStatus(expiryDate);
  const dateStr = expiryDate ? formatReadableDate(expiryDate) : "";

  if (status === "EXPIRED") return `Expired ${dateStr}`;
  if (status === "EXPIRING_SOON") {
    const days = daysUntilExpiry(expiryDate);
    return `Expires in ${days} day${days === 1 ? "" : "s"}`;
  }
  if (status === "VALID") return `Valid until ${dateStr}`;
  return "";
}

export default function DocumentVerifyRow({
  doc,
  registrationStatus,
}: {
  doc: DocRow;
  registrationStatus: string;
}) {
  const router = useRouter();
  const [expiry, setExpiry] = useState(
    doc.expiryDate ? doc.expiryDate.slice(0, 10) : ""
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const viewUrl = `/api/staff/documents/${doc.id}/view`;
  const today = new Date().toISOString().slice(0, 10);
  const isExpiryValid = expiry !== "" && expiry > today;

  // dokumen cuma bisa diubah kalau registrasi masih PENDING
  const locked = registrationStatus !== "PENDING";

  const expiryStatus = getExpiryStatus(doc.expiryDate);
  const isExpired = expiryStatus === "EXPIRED";

  async function save(verify: boolean) {
    setError(null);
    if (verify && !isExpiryValid) {
      setError("Expiry date must be a future date.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/staff/documents/${doc.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isVerified: verify,
          expiryDate: expiry || null,
        }),
      });
      if (res.ok) router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="border-border flex flex-col gap-1 border-b px-4 py-3 last:border-b-0">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            {doc.isVerified ? (
              <CheckCircle2 className="text-success h-4 w-4" />
            ) : (
              <Circle className="text-muted-foreground h-4 w-4" />
            )}
            <span className="text-sm font-medium">{doc.type}</span>

            <CustomDialog
              title={doc.type}
              trigger={
                <button className="text-primary ml-2 inline-flex cursor-pointer items-center gap-1 text-xs hover:underline">
                  <Eye className="h-3.5 w-3.5" />
                  View
                </button>
              }
            >
              <DocumentPreview url={viewUrl} type={doc.type} />
            </CustomDialog>
          </div>

          {expiryStatus !== "NO_EXPIRY" && (
            <span
              className={cn(
                "inline-flex w-fit items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
                EXPIRY_BADGE_STYLE[expiryStatus],
              )}
            >
              {isExpired && <AlertTriangle className="h-3 w-3" />}
              {expiryBadgeLabel(doc.expiryDate)}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={expiry}
            min={today}
            onChange={(e) => {
              setExpiry(e.target.value);
              setError(null);
            }}
            disabled={loading || locked || doc.isVerified}
            className="border-border h-9 w-40 rounded-md border text-sm disabled:opacity-50 [&::-webkit-calendar-picker-indicator]:invert"
          />
          <Button
            size="sm"
            variant={doc.isVerified ? "outline" : "default"}
            disabled={loading || locked || (!doc.isVerified && !isExpiryValid)}
            onClick={() => save(!doc.isVerified)}
            className="cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
          >
            {doc.isVerified ? "Unverify" : "Verify"}
          </Button>
        </div>
      </div>

      {error && <p className="text-destructive pl-6 text-xs">{error}</p>}
    </div>
  );
}

function DocumentPreview({ url, type }: { url: string; type: string }) {
  const [isPdf, setIsPdf] = useState(false);

  return (
    <div className="flex w-full items-center justify-center">
      {isPdf ? (
        <iframe src={url} className="h-[70vh] w-full rounded-md" title={type} />
      ) : (
        <img
          src={url}
          alt={type}
          className="max-h-[70vh] w-auto rounded-md object-contain"
          onError={() => setIsPdf(true)}
        />
      )}
    </div>
  );
}
