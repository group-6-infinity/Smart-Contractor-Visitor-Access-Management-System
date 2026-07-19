"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import CustomDialog from "@/components/common/c-dialog";
import VisitRequestForm from "@/components/layouts/forms/visit-request-form";
import { Button } from "@/components/ui/button";
import { CheckIcon, Ban, LogIn, LogOut, AlertTriangle } from "lucide-react";

interface DocInfo {
  type: string;
  expiryDate: string | null;
}

interface VisitData {
  id: string;
  purpose: string;
  visitDate: string;
  windowStart: string;
  windowEnd: string;
  status: string;
  authorizedZones?: string[];
  checkStatus?: string | null; // INSIDE | CHECKED_OUT | OVERSTAY | DENIED | null
  deniedReason?: string | null;
}

const statusConfig: Record<string, string> = {
  PENDING: "border-info-border text-info bg-info-muted",
  APPROVED: "border-success-border text-success bg-success-muted",
  REJECTED: "border-destructive text-destructive bg-destructive-muted",
  ACTIVE: "border-info-border text-info bg-info-muted",
  COMPLETED: "border-border text-muted-foreground bg-muted",
  CANCELLED: "border-border text-muted-foreground bg-muted",
};

// badge berdasarkan check-in event terakhir (lebih informatif dari status visit)
const CHECK_STATUS_CONFIG: Record<
  string,
  { label: string; className: string; icon: React.ElementType }
> = {
  INSIDE: {
    label: "Inside",
    className: "border-info-border text-info bg-info-muted",
    icon: LogIn,
  },
  CHECKED_OUT: {
    label: "Completed",
    className: "border-border text-muted-foreground bg-muted",
    icon: LogOut,
  },
  OVERSTAY: {
    label: "Overstay",
    className: "border-destructive text-destructive bg-destructive-muted",
    icon: AlertTriangle,
  },
  DENIED: {
    label: "Denied at gate",
    className: "border-destructive text-destructive bg-destructive-muted",
    icon: Ban,
  },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// tentuin badge yang ditampilin: check-in event terakhir menang atas status visit
function resolveBadge(visit: VisitData) {
  if (visit.checkStatus && CHECK_STATUS_CONFIG[visit.checkStatus]) {
    return {
      type: "check" as const,
      ...CHECK_STATUS_CONFIG[visit.checkStatus],
    };
  }
  return {
    type: "visit" as const,
    label: visit.status,
    className: statusConfig[visit.status] ?? "",
    icon: null,
  };
}

function GatePass({
  visit,
  token,
  documents,
  zoneNames,
}: {
  visit: VisitData;
  token: string;
  documents: DocInfo[];
  zoneNames: Record<string, string>;
}) {
  return (
    <div className="flex flex-col items-center gap-6 py-2">
      <div className="flex flex-col items-center gap-2">
        <span className="border-success-border text-success bg-success-muted inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm font-medium">
          <CheckIcon className="h-4 w-4" />
          APPROVED
        </span>
        <h2 className="text-2xl font-bold">Your Gate Pass</h2>
        <p className="text-muted-foreground text-sm">
          Show this QR at the gate scanner
        </p>
      </div>

      <div className="rounded-xl border bg-white p-4">
        <QRCodeSVG value={token} size={220} level="H" marginSize={4} />
      </div>

      <p className="text-muted-foreground font-mono text-sm">{token}</p>

      <div className="bg-muted/40 w-full space-y-3 rounded-lg p-4">
        <p className="text-muted-foreground text-xs uppercase">Visit Detail</p>

        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Purpose</span>
          <span className="max-w-[60%] text-right leading-loose font-medium">
            {visit.purpose}
          </span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Date</span>
          <span className="font-medium">{formatDate(visit.visitDate)}</span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Window</span>
          <span className="font-medium">
            {formatTime(visit.windowStart)} – {formatTime(visit.windowEnd)}
          </span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Zones</span>
          <div className="flex flex-wrap justify-end gap-2">
            {visit.authorizedZones && visit.authorizedZones.length > 0 ? (
              visit.authorizedZones.map((zone) => (
                <span
                  key={zone}
                  className="bg-primary text-primary-foreground rounded-full px-3 py-0.5 text-xs"
                >
                  {zoneNames[zone] ?? zone}
                </span>
              ))
            ) : (
              <span className="text-muted-foreground text-xs">
                Pending assignment
              </span>
            )}
          </div>
        </div>
      </div>

      {documents.length > 0 && (
        <div className="bg-muted/40 w-full space-y-2 rounded-lg p-4">
          <p className="text-muted-foreground text-xs uppercase">
            Document Validity
          </p>
          {documents.map((doc) => {
            const expired =
              doc.expiryDate && new Date(doc.expiryDate) < new Date();
            return (
              <div
                key={doc.type}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-muted-foreground">{doc.type}</span>
                {doc.expiryDate ? (
                  <span
                    className={
                      expired ? "text-destructive font-medium" : "font-medium"
                    }
                  >
                    {expired ? "Expired " : "Valid until "}
                    {new Date(doc.expiryDate).toLocaleDateString("id-ID")}
                  </span>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function VisitSection({
  token,
  initialVisits = [],
  documents = [],
  zoneNames = {},
  visitDisabled = false,
}: {
  token: string;
  initialVisits?: VisitData[];
  documents?: DocInfo[];
  zoneNames?: Record<string, string>;
  visitDisabled?: boolean;
}) {
  const [visits, setVisits] = useState<VisitData[]>(initialVisits);
  const [open, setOpen] = useState(false);

  function handleSuccess(newVisit: VisitData) {
    setVisits((prev) => [newVisit, ...prev]);
    setOpen(false);
  }

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Visit Requests</h3>
        {visitDisabled ? (
          <div className="group relative">
            <Button
              disabled
              className="cursor-not-allowed font-semibold opacity-50"
            >
              New Visit Request
            </Button>
            <span className="bg-foreground text-background pointer-events-none absolute top-full right-0 mt-1 rounded px-2 py-1 text-xs opacity-0 transition-opacity group-hover:opacity-100">
              Update expired documents first
            </span>
          </div>
        ) : (
          <CustomDialog
            open={open}
            onOpenChange={setOpen}
            title="New Visit Request"
            className="max-w-2xl!"
            trigger={
              <Button className="cursor-pointer font-semibold">
                New Visit Request
              </Button>
            }
          >
            <VisitRequestForm
              token={token}
              onSuccess={handleSuccess}
              onCancel={() => setOpen(false)}
            />
          </CustomDialog>
        )}
      </div>

      {visits.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center text-sm">
          No visit requests yet.
        </p>
      ) : (
        <div className="border-border overflow-hidden rounded-sm border border-dashed p-2">
          <div className="bg-muted grid grid-cols-[1fr_2fr_1.2fr_0.8fr] gap-4 px-4 py-3 text-sm font-semibold">
            <span>Date</span>
            <span>Purpose</span>
            <span>Status</span>
            <span>QR</span>
          </div>

          {visits.map((visit, i) => {
            const badge = resolveBadge(visit);
            const BadgeIcon = badge.icon;
            return (
              <div
                key={visit.id}
                className={`px-4 py-3 text-sm ${i % 2 === 1 ? "bg-muted/40" : ""}`}
              >
                <div className="grid grid-cols-[1fr_2fr_1.2fr_0.8fr] items-center gap-4">
                  <span>{formatDate(visit.visitDate)}</span>
                  <span className="truncate">{visit.purpose}</span>
                  <span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${badge.className}`}
                    >
                      {BadgeIcon && <BadgeIcon className="h-3 w-3" />}
                      {badge.label}
                    </span>
                  </span>
                  <span>
                    {/* QR cuma muncul kalau approved + belum denied/checked-out */}
                    {visit.status === "APPROVED" &&
                    visit.checkStatus !== "CHECKED_OUT" ? (
                      <CustomDialog
                        className="max-w-xl"
                        trigger={
                          <button className="text-primary cursor-pointer text-sm hover:underline">
                            View
                          </button>
                        }
                      >
                        <GatePass
                          visit={visit}
                          token={token}
                          documents={documents}
                          zoneNames={zoneNames}
                        />
                      </CustomDialog>
                    ) : (
                      <span className="text-muted-foreground text-sm">–</span>
                    )}
                  </span>
                </div>

                {/* Alasan denied — transparan ke visitor */}
                {visit.checkStatus === "DENIED" && visit.deniedReason && (
                  <div className="border-destructive-border bg-destructive-muted text-destructive mt-2 rounded-md border p-2 text-xs">
                    <span className="font-semibold">Entry denied: </span>
                    {visit.deniedReason}
                    <p className="text-muted-foreground mt-1">
                      Please resolve the issue above and show your QR at the
                      gate again. Your pass is still valid within the visit
                      window.
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
