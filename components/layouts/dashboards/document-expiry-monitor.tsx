"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { FileWarning, Clock, XCircle, Eye, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import CustomDialog from "@/components/common/c-dialog";
import { RotateCcw } from "lucide-react";

interface DocRow {
  id: string;
  type: string;
  expiryDate: string | null;
  isVerified: boolean;
  daysLeft: number | null;
  status: string;
  fullName: string;
  company: string;
  registrationId: string;
}

interface Summary {
  expiring30: number;
  expiring7: number;
  expired: number;
  review: number;
}

const STATUS_STYLE: Record<string, string> = {
  VALID: "border-success-border text-success bg-success-muted",
  EXPIRING_SOON: "border-info-border text-info bg-info-muted",
  EXPIRED: "border-destructive text-destructive bg-destructive-muted",
  REVIEW: "border-info-border text-info bg-info-muted",
  NO_EXPIRY: "border-border text-muted-foreground bg-muted",
};

const STATUS_LABEL: Record<string, string> = {
  VALID: "Valid",
  EXPIRING_SOON: "Expiring Soon",
  EXPIRED: "Expired",
  REVIEW: "Needs Review",
  NO_EXPIRY: "No Expiry",
};

const FILTERS = [
  { value: "all", label: "All" },
  { value: "review", label: "Needs Review" },
  { value: "expiring30", label: "Expiring in 30d" },
  { value: "expiring7", label: "Expiring in 7d" },
  { value: "expired", label: "Expired" },
];

const NO_EXPIRY_TYPES = ["KTP", "FACE_PHOTO"];

function formatReadableDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function DocumentExpiryMonitor() {
  const [docs, setDocs] = useState<DocRow[]>([]);
  const [summary, setSummary] = useState<Summary>({
    expiring30: 0,
    expiring7: 0,
    expired: 0,
    review: 0,
  });
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;
    async function load() {
      await Promise.resolve();
      if (!active) return;
      setLoading(true);
      try {
        const res = await fetch(
          `/api/staff/documents/monitor?filter=${filter}`,
        );
        if (!res.ok || !active) return;
        const data = await res.json();
        if (!active) return;
        setDocs(data.documents);
        setSummary(data.summary);
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [filter, refreshKey]);

  function refresh() {
    setRefreshKey((k) => k + 1);
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <SummaryCard
          label="Needs review"
          value={summary.review}
          icon={FileWarning}
          accent="bg-info-muted text-info"
        />
        <SummaryCard
          label="Expiring in 30d"
          value={summary.expiring30}
          icon={Clock}
          accent="bg-info-muted text-info"
        />
        <SummaryCard
          label="Expiring in 7d"
          value={summary.expiring7}
          icon={Clock}
          accent="bg-primary/10 text-primary"
        />
        <SummaryCard
          label="Expired"
          value={summary.expired}
          icon={XCircle}
          accent="bg-destructive-muted text-destructive"
        />
      </div>

      <div className="border-border flex flex-wrap gap-1 border-b">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={cn(
              "relative px-4 py-2 text-sm font-medium transition-colors",
              filter === f.value
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {f.label}
            {filter === f.value && (
              <span className="bg-primary absolute inset-x-0 -bottom-px h-0.5" />
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-muted-foreground py-16 text-center text-sm">
          Loading...
        </p>
      ) : docs.length === 0 ? (
        <p className="text-muted-foreground py-16 text-center text-sm">
          No documents in this category.
        </p>
      ) : (
        <div className="border-border overflow-hidden rounded-lg border">
          <div className="bg-muted text-muted-foreground grid grid-cols-[1.3fr_1.3fr_0.8fr_1.1fr_0.9fr_1.4fr] gap-4 px-4 py-3 text-xs font-semibold uppercase">
            <span>Person</span>
            <span>Company</span>
            <span>Document</span>
            <span>Expiry</span>
            <span>Status</span>
            <span>Actions</span>
          </div>
          {docs.map((d, i) => (
            <div
              key={d.id}
              className={cn(
                "grid grid-cols-[1.3fr_1.3fr_0.8fr_1.1fr_0.9fr_1.4fr] items-center gap-4 px-4 py-3 text-sm",
                d.status === "EXPIRED"
                  ? "bg-destructive-muted/30"
                  : i % 2 === 1
                    ? "bg-muted/20"
                    : "",
              )}
            >
              <span className="font-medium">{d.fullName}</span>
              <span className="text-muted-foreground truncate">
                {d.company}
              </span>
              <span>{d.type}</span>
              <span className="text-muted-foreground text-xs">
                {d.expiryDate ? (
                  <>
                    {formatReadableDate(d.expiryDate)}
                    {d.daysLeft !== null && (
                      <span
                        className={cn(
                          "ml-1",
                          d.daysLeft < 0
                            ? "text-destructive"
                            : d.daysLeft <= 7
                              ? "text-primary"
                              : "",
                        )}
                      >
                        (
                        {d.daysLeft < 0
                          ? `${Math.abs(d.daysLeft)}d ago`
                          : `${d.daysLeft}d left`}
                        )
                      </span>
                    )}
                  </>
                ) : (
                  "—"
                )}
              </span>
              <span>
                <span
                  className={cn(
                    "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
                    STATUS_STYLE[d.status],
                  )}
                >
                  {STATUS_LABEL[d.status]}
                </span>
              </span>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <CustomDialog
                  title={`${d.type} — ${d.fullName}`}
                  trigger={
                    <button className="text-primary inline-flex cursor-pointer items-center gap-1 text-xs hover:underline">
                      <Eye className="h-3.5 w-3.5" />
                      View
                    </button>
                  }
                >
                  <DocumentPreview docId={d.id} type={d.type} />
                </CustomDialog>

                {/* Toggle verify/unverify berdasarkan isVerified */}
                {d.isVerified ? (
                  <DocumentUnverifyAction docId={d.id} onDone={refresh} />
                ) : (
                  <VerifyAction
                    docId={d.id}
                    docType={d.type}
                    onDone={refresh}
                  />
                )}

                <Link
                  href={`/staff/registrations/${d.registrationId}`}
                  className="text-muted-foreground hover:text-primary"
                  aria-label="View registration"
                >
                  <Eye className="h-4 w-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function VerifyAction({
  docId,
  docType,
  onDone,
}: {
  docId: string;
  docType: string;
  onDone: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [expiry, setExpiry] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const noExpiry = NO_EXPIRY_TYPES.includes(docType.toUpperCase());
  const today = new Date().toISOString().slice(0, 10);
  const isValid = noExpiry || (expiry !== "" && expiry > today);

  async function handleVerify() {
    setError(null);
    if (!isValid) {
      setError("Expiry date must be a future date.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/staff/documents/${docId}/verify-upload`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isVerified: true,
          expiryDate: noExpiry ? null : expiry,
          noExpiry,
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
        {noExpiry ? (
          <div className="border-info-border bg-info-muted text-info rounded-lg border p-3 text-sm">
            <p className="font-semibold">{docType} has no expiry date</p>
            <p className="mt-1">
              This document type is valid for a lifetime. Verifying will mark it
              as valid with no expiry.
            </p>
          </div>
        ) : (
          <>
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
          </>
        )}

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
            {loading
              ? "Verifying..."
              : noExpiry
                ? "Verify (No Expiry)"
                : "Verify & Set Expiry"}
          </Button>
        </div>
      </div>
    </CustomDialog>
  );
}

function DocumentUnverifyAction({
  docId,
  onDone,
}: {
  docId: string;
  onDone: () => void;
}) {
  const [loading, setLoading] = useState(false);

  async function handleUnverify() {
    setLoading(true);
    try {
      const res = await fetch(`/api/staff/documents/${docId}/verify-upload`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isVerified: false }),
      });
      if (res.ok) onDone();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleUnverify}
      disabled={loading}
      className="text-muted-foreground hover:text-foreground h-auto cursor-pointer gap-1 px-2 py-1 text-xs"
    >
      <RotateCcw className="h-3.5 w-3.5" />
      {loading ? "..." : "Unverify"}
    </Button>
  );
}

function DocumentPreview({ docId, type }: { docId: string; type: string }) {
  const [isPdf, setIsPdf] = useState(false);
  const url = `/api/staff/documents/${docId}/view`;

  return (
    <div className="flex w-full items-center justify-center">
      {isPdf ? (
        <iframe src={url} className="h-[70vh] w-full rounded-md" title={type} />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
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

function SummaryCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  accent: string;
}) {
  return (
    <div className="border-border bg-card flex items-center justify-between rounded-xl border p-4">
      <div>
        <p className="text-muted-foreground text-sm">{label}</p>
        <p className="mt-1 text-2xl font-semibold">{value}</p>
      </div>
      <div
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-lg",
          accent,
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
    </div>
  );
}
