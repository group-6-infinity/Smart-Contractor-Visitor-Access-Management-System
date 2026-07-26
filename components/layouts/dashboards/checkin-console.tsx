"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  IdCard,
  CheckCircle2,
  Ban,
  AlertTriangle,
  LogOut,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import QrScanner from "./qr-scanner";
import { formatDateWIB, formatTimeWIB } from "@/lib/datetime";

interface DocStatus {
  id: string;
  type: string;
  isVerified: boolean;
  expiryStatus: string;
  expiryDate: string | null;
}

interface Risk {
  level: "LOW" | "MEDIUM" | "HIGH";
  isFirstVisit: boolean;
  requiresManualReview: boolean;
  reasons: string[];
}

interface ValidateResult {
  valid: boolean;
  blocked: boolean;
  blacklisted?: boolean;
  alreadyInside?: boolean;
  reason?: string;
  message?: string;
  fullName?: string;
  company?: string;
  scheduleAllowed?: boolean;
  scheduleReason?: string | null;
  registration?: {
    id: string;
    fullName: string;
    company: string;
    type: string;
    photoPath: string | null;
  };
  visit?: {
    id: string;
    purpose: string;
    visitDate: string;
    windowStart: string;
    windowEnd: string;
    authorizedZones: string[];
    zoneNames?: Record<string, string>;
  };
  risk?: Risk;
  documents?: DocStatus[];
  needsOverride?: boolean;
  hasExpiringSoon?: boolean;
}

const RISK_STYLE: Record<string, string> = {
  LOW: "bg-success-muted text-success",
  MEDIUM: "bg-info-muted text-info",
  HIGH: "bg-destructive-muted text-destructive",
};

function formatReadableDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function CheckinConsole() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ValidateResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [overrideOpen, setOverrideOpen] = useState(false);
  const [justification, setJustification] = useState("");

  const [denyOpen, setDenyOpen] = useState(false);
  const [denyReason, setDenyReason] = useState("");

  async function handleValidate() {
    if (!token.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/staff/checkin/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: token.trim() }),
      });
      const data = await res.json();
      if (!res.ok && res.status !== 403) {
        setError(data.message ?? "Validation failed");
        return;
      }
      setResult(data);
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function handleScan(scannedToken: string) {
    setToken(scannedToken);
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/staff/checkin/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: scannedToken }),
      });
      const data = await res.json();
      if (!res.ok && res.status !== 403) {
        setError(data.message ?? "Validation failed");
        return;
      }
      setResult(data);
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCheckin(override = false) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/staff/checkin/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: token.trim(),
          override,
          justification: override ? justification : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? "Check-in failed");
        return;
      }
      resetConsole();
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
      setOverrideOpen(false);
    }
  }

  async function handleDeny() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/staff/checkin/deny", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: token.trim(),
          reason: denyReason.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? "Deny failed");
        return;
      }
      resetConsole();
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
      setDenyOpen(false);
    }
  }

  function resetConsole() {
    setToken("");
    setResult(null);
    setError(null);
    setJustification("");
    setDenyReason("");
  }

  return (
    <div className="flex min-h-svh flex-col">
      <header className="border-border flex items-center justify-between border-b px-6 py-4">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold">SecureGate</span>
          <span className="text-primary text-sm font-medium">
            | GATE A · Check-In
          </span>
        </div>
        <button
          onClick={async () => {
            await fetch("/api/staff/logout", { method: "POST" });
            router.push("/internal/staff/login");
            router.refresh();
          }}
          className="border-border hover:bg-muted flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </header>

      <div className="grid flex-1 grid-cols-1 lg:grid-cols-2">
        {/* Left — scanner / token entry */}
        <div className="border-border flex flex-col gap-4 border-r p-8">
          <p className="text-primary text-sm font-semibold uppercase">
            Scan QR Code
          </p>

          {result?.blacklisted ? (
            <div className="bg-foreground/90 flex aspect-video items-center justify-center rounded-xl">
              <div className="flex flex-col items-center gap-4">
                <div className="bg-destructive-muted flex h-20 w-20 items-center justify-center rounded-full">
                  <Ban className="text-destructive h-10 w-10" />
                </div>
                <p className="text-lg font-medium text-white">
                  Match Flagged On Blacklist
                </p>
              </div>
            </div>
          ) : result?.valid && !result.blocked ? (
            <div className="bg-foreground/90 flex aspect-video items-center justify-center rounded-xl">
              <div className="flex flex-col items-center gap-3 text-white">
                <CheckCircle2 className="h-10 w-10" />
                <p className="text-lg font-medium">QR Captured</p>
              </div>
            </div>
          ) : (
            <QrScanner onScan={handleScan} disabled={loading} />
          )}

          {result?.valid && !result.blocked && result.visit && (
            <p className="border-primary/40 text-muted-foreground rounded-lg border border-dashed px-4 py-3 text-sm">
              QR valid · token {token}
            </p>
          )}

          {!result && (
            <div className="space-y-2">
              <label className="text-muted-foreground text-sm">
                Manual Entry
              </label>
              <div className="flex gap-2">
                <Input
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleValidate()}
                  placeholder="Enter Token"
                  disabled={loading}
                  className="border-border rounded-md border"
                />
                <Button
                  onClick={handleValidate}
                  disabled={loading || !token.trim()}
                  className="cursor-pointer"
                >
                  {loading ? "..." : "Validate"}
                </Button>
              </div>
            </div>
          )}

          {error && <p className="text-destructive text-sm">{error}</p>}
        </div>

        {/* Right — visitor info */}
        <div className="flex flex-col p-8">
          {!result ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
              <div className="bg-primary/15 flex h-20 w-20 items-center justify-center rounded-2xl">
                <IdCard className="text-primary h-10 w-10" />
              </div>
              <div>
                <p className="text-2xl font-bold">Visitor Info Appears Here</p>
                <p className="text-muted-foreground text-sm">
                  Scan or enter a token to begin
                </p>
              </div>
            </div>
          ) : result.blacklisted ? (
            <BlacklistedView result={result} onNext={resetConsole} />
          ) : result.blocked ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
              <AlertTriangle className="text-destructive h-12 w-12" />
              <p className="text-lg font-medium">{result.message}</p>
              <Button
                variant="outline"
                onClick={resetConsole}
                className="cursor-pointer"
              >
                Scan Next
              </Button>
            </div>
          ) : (
            <ApprovedView
              result={result}
              loading={loading}
              onGrant={() => handleCheckin(false)}
              onOverride={() => setOverrideOpen(true)}
              onDeny={() => setDenyOpen(true)}
              onScanNext={resetConsole}
            />
          )}
        </div>
      </div>

      {/* Override modal */}
      {overrideOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-card w-full max-w-lg rounded-xl p-6 shadow-xl">
            <h3 className="text-xl font-bold">Manual Override</h3>

            <div className="mt-4">
              <div className="flex items-center justify-between">
                <label className="text-sm">
                  <span className="text-destructive">*</span> Justification
                </label>
                <span className="text-muted-foreground text-xs">
                  {justification.length} / 300
                </span>
              </div>
              <textarea
                value={justification}
                onChange={(e) => setJustification(e.target.value.slice(0, 300))}
                rows={3}
                placeholder="e.g. Contractor confirmed renewal in progress, verified verbally with HSE supervisor on duty"
                className="border-border bg-input/50 focus-visible:ring-ring/30 mt-1 w-full rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-3"
              />
            </div>

            <div className="border-primary/40 text-muted-foreground mt-4 rounded-lg border border-dashed p-4 text-sm">
              By confirming, you take responsibility for this exception. A
              traceable record will be created in the audit trail and flagged
              for HSE review.
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setOverrideOpen(false)}
                disabled={loading}
                className="cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleCheckin(true)}
                disabled={loading || !justification.trim()}
                className="cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Confirming..." : "Confirm Override"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Deny modal */}
      {denyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-card w-full max-w-lg rounded-xl p-6 shadow-xl">
            <h3 className="text-xl font-bold">Deny Entry</h3>
            <p className="text-muted-foreground mt-1 text-sm">
              This will be logged as a denied entry. The visit approval remains
              valid — the person may return later.
            </p>

            <div className="mt-4">
              <div className="flex items-center justify-between">
                <label className="text-sm">Reason (optional)</label>
                <span className="text-muted-foreground text-xs">
                  {denyReason.length} / 300
                </span>
              </div>
              <textarea
                value={denyReason}
                onChange={(e) => setDenyReason(e.target.value.slice(0, 300))}
                rows={3}
                placeholder="e.g. Could not verify identity against registration photo"
                className="border-border bg-input/50 focus-visible:ring-ring/30 mt-1 w-full rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-3"
              />
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setDenyOpen(false)}
                disabled={loading}
                className="cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeny}
                disabled={loading}
                className="bg-destructive hover:bg-destructive/90 cursor-pointer text-white"
              >
                {loading ? "Processing..." : "Confirm Deny"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function BlacklistedView({
  result,
  onNext,
}: {
  result: ValidateResult;
  onNext: () => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <div className="bg-primary/15 flex h-14 w-14 items-center justify-center rounded-xl">
          <User className="h-7 w-7" />
        </div>
        <div>
          <p className="text-xl font-bold uppercase">{result.fullName}</p>
          <p className="text-muted-foreground">{result.company}</p>
        </div>
      </div>

      <div className="border-primary/40 text-muted-foreground rounded-lg border border-dashed p-4 text-sm">
        Alert dispatched to operator &amp; HSE. No override available for
        blacklisted individuals.
      </div>

      <Button onClick={onNext} className="cursor-pointer font-semibold">
        Acknowledge &amp; Scan Next
      </Button>
    </div>
  );
}

function ApprovedView({
  result,
  loading,
  onGrant,
  onOverride,
  onDeny,
  onScanNext,
}: {
  result: ValidateResult;
  loading: boolean;
  onGrant: () => void;
  onOverride: () => void;
  onDeny: () => void;
  onScanNext: () => void;
}) {
  const { registration, visit, risk, documents, needsOverride, alreadyInside } =
    result;
  if (!registration || !visit || !risk) return null;

  const scheduleBlocked = result.scheduleAllowed === false;
  const zoneNames = visit.zoneNames ?? {};

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-primary/15 flex h-14 w-14 items-center justify-center rounded-xl">
            <User className="h-7 w-7" />
          </div>
          <div>
            <p className="text-xl font-bold uppercase">
              {registration.fullName}
            </p>
            <p className="text-muted-foreground">{registration.company}</p>
          </div>
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium",
            RISK_STYLE[risk.level],
          )}
        >
          <CheckCircle2 className="h-4 w-4" />
          {risk.level.charAt(0) + risk.level.slice(1).toLowerCase()} Risk
        </span>
      </div>

      <div className="bg-muted/40 space-y-3 rounded-lg p-4 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">PURPOSE</span>
          <span className="font-semibold">{visit.purpose}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">VISIT DATE</span>
          <span className="font-semibold">
            {formatDateWIB(visit.visitDate)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">VISIT WINDOW</span>
          <span className="font-semibold">
            {formatTimeWIB(visit.windowStart)} –{" "}
            {formatTimeWIB(visit.windowEnd)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">ZONES</span>
          <div className="flex flex-wrap justify-end gap-2">
            {visit.authorizedZones.map((z) => (
              <span
                key={z}
                className="bg-success text-success-foreground rounded-full px-3 py-0.5 text-xs"
              >
                {zoneNames[z] ?? z}
              </span>
            ))}
          </div>
        </div>
      </div>

      {documents && documents.length > 0 && (
        <div className="space-y-2">
          {documents.map((d) => (
            <div
              key={d.id}
              className="flex items-center justify-between text-sm"
            >
              <span className="text-muted-foreground">{d.type}</span>
              {d.expiryStatus === "EXPIRED" ? (
                <span className="text-destructive font-medium">Expired</span>
              ) : d.expiryStatus === "EXPIRING_SOON" ? (
                <span className="text-primary inline-flex items-center gap-1 font-medium">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Expiring{" "}
                  {d.expiryDate ? `(${formatReadableDate(d.expiryDate)})` : ""}
                </span>
              ) : d.expiryStatus === "NO_EXPIRY" ? (
                <span className="text-success inline-flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Valid (no expiry)
                </span>
              ) : (
                <span className="text-success inline-flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Valid
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {risk.requiresManualReview && (
        <div className="border-primary/40 text-muted-foreground rounded-lg border border-dashed p-3 text-sm">
          {risk.isFirstVisit ? "First Visit · " : ""}
          Manual Review Required {risk.reasons.join(", ")}
        </div>
      )}

      {/* Warning kalau di luar jadwal */}
      {scheduleBlocked && (
        <div className="border-destructive-border bg-destructive-muted text-destructive rounded-lg border p-3 text-sm">
          <p className="font-semibold">Outside scheduled window</p>
          <p>{result.scheduleReason}</p>
        </div>
      )}

      {alreadyInside && (
        <div className="border-info-border bg-info-muted text-info rounded-lg border p-3 text-sm">
          This person is already checked in.
        </div>
      )}

      {!alreadyInside ? (
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onDeny}
            disabled={loading}
            className="text-destructive flex-1 cursor-pointer"
          >
            Deny Entry
          </Button>
          {needsOverride ? (
            <Button
              onClick={onOverride}
              disabled={loading || scheduleBlocked}
              className="flex-1 cursor-pointer font-semibold disabled:opacity-50"
            >
              Override &amp; Grant Entry
            </Button>
          ) : (
            <Button
              onClick={onGrant}
              disabled={loading || scheduleBlocked}
              className="flex-1 cursor-pointer font-semibold disabled:opacity-50"
            >
              {loading ? "Processing..." : "Grant Entry"}
            </Button>
          )}
        </div>
      ) : (
        <Button variant="outline" onClick={onScanNext} className="cursor-pointer">
          Scan Next
        </Button>
      )}
    </div>
  );
}
