import prisma from "@/lib/prisma";
import { verifyAuditChain } from "@/lib/audit-log";
import { formatDateWIB, formatTimeWIB } from "@/lib/datetime";
import { ShieldCheck, ShieldAlert } from "lucide-react";

const ACTION_LABEL: Record<string, string> = {
  CHECK_IN: "Check-in",
  CHECK_IN_OVERRIDE: "Check-in (override)",
  CHECK_IN_DENIED: "Check-in denied",
  CHECK_OUT: "Check-out",
  BLACKLIST_BLOCKED: "Blacklist block",
  REGISTRATION_APPROVED: "Registration approved",
  REGISTRATION_REJECTED: "Registration rejected",
  VISIT_APPROVED: "Visit approved",
  VISIT_REJECTED: "Visit rejected",
  BLACKLIST_ADDED: "Blacklist added",
  BLACKLIST_REMOVED: "Blacklist removed",
  STAFF_CREATED: "Staff account created",
  STAFF_UPDATED: "Staff account updated",
};

// "fullName" -> "Full name", "isActive" -> "Is active"
function toLabel(key: string): string {
  const withSpaces = key.replace(/([A-Z])/g, " $1").toLowerCase();
  return withSpaces.charAt(0).toUpperCase() + withSpaces.slice(1);
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return value.length ? value.join(", ") : "—";
  return String(value);
}

function MetadataDetails({ metadata }: { metadata: string }) {
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(metadata);
  } catch {
    return <span className="text-muted-foreground text-xs">—</span>;
  }
  const entries = Object.entries(parsed ?? {});
  if (entries.length === 0) return <span className="text-muted-foreground text-xs">—</span>;

  return (
    <dl className="space-y-0.5 text-xs">
      {entries.map(([key, value]) => (
        <div key={key} className="flex gap-1">
          <dt className="text-foreground shrink-0 font-medium">
            {toLabel(key)}:
          </dt>
          <dd className="text-muted-foreground truncate">
            {formatValue(value)}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export default async function AuditLogPage() {
  const [entries, verification] = await Promise.all([
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    verifyAuditChain(),
  ]);

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Audit Log</h1>
        <p className="text-muted-foreground text-sm">
          Immutable, SHA-256 hash-chained record of check-ins, approvals,
          blacklist changes, and staff account changes.
        </p>
      </div>

      <div
        className={`mb-6 flex items-start gap-3 rounded-lg border p-4 text-sm ${
          verification.valid
            ? "border-success-border bg-success-muted text-success"
            : "border-destructive-border bg-destructive-muted text-destructive"
        }`}
      >
        {verification.valid ? (
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
        ) : (
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
        )}
        <div>
          <p className="font-semibold">
            {verification.valid
              ? `Chain verified — ${verification.totalChecked} record${verification.totalChecked === 1 ? "" : "s"} intact`
              : "Tampering detected"}
          </p>
          {!verification.valid && (
            <p className="mt-0.5">
              {verification.reason} (record {verification.brokenAtId})
            </p>
          )}
        </div>
      </div>

      <div className="border-border overflow-hidden rounded-lg border">
        <div className="bg-muted text-muted-foreground grid grid-cols-[1.1fr_1.3fr_1.3fr_1.5fr_1fr] gap-4 px-4 py-3 text-xs font-semibold uppercase">
          <span>When</span>
          <span>Action</span>
          <span>By</span>
          <span>Details</span>
          <span>Hash</span>
        </div>
        {entries.length === 0 ? (
          <p className="text-muted-foreground py-16 text-center text-sm">
            No audit entries yet.
          </p>
        ) : (
          entries.map((e, i) => (
            <div
              key={e.id}
              className={`grid grid-cols-[1.1fr_1.3fr_1.3fr_1.5fr_1fr] items-start gap-4 px-4 py-3 text-sm ${
                i % 2 === 1 ? "bg-muted/20" : ""
              }`}
            >
              <span className="text-muted-foreground text-xs">
                {formatDateWIB(e.createdAt)}
                <br />
                {formatTimeWIB(e.createdAt)}
              </span>
              <span className="font-medium">
                {ACTION_LABEL[e.action] ?? e.action}
              </span>
              <span className="text-muted-foreground truncate text-xs">
                {e.actorEmail ?? "system"}
              </span>
              <details className="text-muted-foreground text-xs">
                <summary className="text-primary cursor-pointer">
                  {e.targetType ?? "—"}
                </summary>
                <div className="mt-1.5">
                  <MetadataDetails metadata={e.metadata} />
                </div>
              </details>
              <details className="text-muted-foreground text-xs">
                <summary className="text-primary cursor-pointer font-mono">
                  {e.hash.slice(0, 10)}…
                </summary>
                <p className="mt-1.5 font-mono break-all">{e.hash}</p>
              </details>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
