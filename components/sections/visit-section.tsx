"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import CustomDialog from "@/components/common/c-dialog";
import VisitRequestForm from "@/components/layouts/forms/visit-request-form";
import { Button } from "@/components/ui/button";
import { CheckIcon } from "lucide-react";

interface VisitData {
  id: string;
  purpose: string;
  visitDate: string;
  windowStart: string;
  windowEnd: string;
  status: string;
  authorizedZones?: string[];
}

const statusConfig: Record<string, string> = {
  PENDING: "border-info-border text-info bg-info-muted",
  APPROVED: "border-success-border text-success bg-success-muted",
  REJECTED: "border-destructive text-destructive bg-destructive-muted",
  ACTIVE: "border-info-border text-info bg-info-muted",
  COMPLETED: "border-border text-muted-foreground bg-muted",
  CANCELLED: "border-border text-muted-foreground bg-muted",
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

function GatePass({ visit, token }: { visit: VisitData; token: string }) {
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
        <QRCodeSVG value={token} size={220} />
      </div>

      <p className="text-muted-foreground font-mono text-sm">{token}</p>

      <div className="bg-muted/40 w-full space-y-3 rounded-lg p-4">
        <p className="text-muted-foreground text-xs uppercase">Visit Detail</p>

        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Purpose</span>
          <span className="leading-loose max-w-[60%] text-right font-medium">
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
          <div className="flex gap-2">
            {visit.authorizedZones && visit.authorizedZones.length > 0 ? (
              visit.authorizedZones.map((zone) => (
                <span
                  key={zone}
                  className="bg-primary text-primary-foreground rounded-full px-3 py-0.5 text-xs"
                >
                  {zone}
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
    </div>
  );
}

export default function VisitSection({
  token,
  initialVisits = [],
}: {
  token: string;
  initialVisits?: VisitData[];
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
        <CustomDialog
          open={open}
          onOpenChange={setOpen}
          title="New Visit Request"
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
      </div>

      {visits.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center text-sm">
          No visit requests yet.
        </p>
      ) : (
        <div className="border-border overflow-hidden rounded-sm border border-dashed p-2">
          {/* Header */}
          <div className="bg-muted grid grid-cols-[1fr_2fr_1fr_0.8fr] gap-4 px-4 py-3 text-sm font-semibold">
            <span>Date</span>
            <span>Purpose</span>
            <span>Status</span>
            <span>QR</span>
          </div>

          {/* Rows */}
          {visits.map((visit, i) => (
            <div
              key={visit.id}
              className={`grid grid-cols-[1fr_2fr_1fr_0.8fr] items-center gap-4 px-4 py-3 text-sm ${
                i % 2 === 1 ? "bg-muted/40" : ""
              }`}
            >
              <span>{formatDate(visit.visitDate)}</span>
              <span className="truncate">{visit.purpose}</span>
              <span>
                <span
                  className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${
                    statusConfig[visit.status] ?? ""
                  }`}
                >
                  {visit.status}
                </span>
              </span>
              <span>
                {visit.status === "APPROVED" ? (
                  <CustomDialog
                    dialogContentWidth="max-w-xl"
                    trigger={
                      <button className="text-primary cursor-pointer text-sm hover:underline">
                        View
                      </button>
                    }
                  >
                    <GatePass visit={visit} token={token} />
                  </CustomDialog>
                ) : (
                  <span className="text-muted-foreground text-sm">–</span>
                )}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
