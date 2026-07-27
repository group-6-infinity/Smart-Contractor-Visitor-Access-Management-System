import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, HardHat, User, CheckCircle2, Circle } from "lucide-react";
import VisitReviewActions from "@/components/layouts/dashboards/visit-review-action";
import EditVisitZones from "@/components/layouts/dashboards/edit-visit-zones";
import { formatDateWIB, formatTimeWIB } from "@/lib/datetime";

const STATUS_STYLE: Record<string, string> = {
  PENDING: "border-info-border text-info bg-info-muted",
  APPROVED: "border-success-border text-success bg-success-muted",
  REJECTED: "border-destructive text-destructive bg-destructive-muted",
  ACTIVE: "border-info-border text-info bg-info-muted",
  COMPLETED: "border-border text-muted-foreground bg-muted",
  CANCELLED: "border-border text-muted-foreground bg-muted",
};

export default async function VisitDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const visit = await prisma.visit.findUnique({
    where: { id },
    select: {
      id: true,
      purpose: true,
      visitDate: true,
      windowStart: true,
      windowEnd: true,
      status: true,
      authorizedZones: true,
      Registration: {
        select: {
          fullName: true,
          company: true,
          email: true,
          type: true,
          documents: {
            select: {
              id: true,
              type: true,
              expiryDate: true,
              isVerified: true,
            },
          },
        },
      },
    },
  });

  if (!visit) notFound();

  const zones = await prisma.zone.findMany({
    where: { isActive: true },
    select: { id: true, name: true, riskLevel: true },
    orderBy: { name: "asc" },
  });

  const reg = visit.Registration;

  return (
    <div className="mx-auto max-w-3xl p-8">
      <Link
        href="/staff/visits"
        className="text-muted-foreground hover:text-foreground mb-6 inline-flex items-center gap-2 text-sm"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to visits
      </Link>

      <div className="mb-8 flex items-start justify-between">
        <div className="space-y-1">
          <div className="text-muted-foreground flex items-center gap-2 text-xs">
            {reg.type === "CONTRACTOR" ? (
              <HardHat className="h-3.5 w-3.5" />
            ) : (
              <User className="h-3.5 w-3.5" />
            )}
            {reg.type}
          </div>
          <h1 className="text-2xl font-semibold uppercase">{reg.fullName}</h1>
          <p className="text-muted-foreground">{reg.company}</p>
        </div>
        <span
          className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium ${STATUS_STYLE[visit.status]}`}
        >
          {visit.status}
        </span>
      </div>

      <div className="border-border mb-6 grid grid-cols-2 gap-4 rounded-lg border p-4">
        <div className="col-span-2">
          <p className="text-muted-foreground text-xs uppercase">Purpose</p>
          <p className="text-sm">{visit.purpose}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs uppercase">Date</p>
          <p className="text-sm">{formatDateWIB(visit.visitDate)}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs uppercase">Window</p>
          <p className="text-sm">
            {formatTimeWIB(visit.windowStart)} – {formatTimeWIB(visit.windowEnd)}
          </p>
        </div>
      </div>

      <div className="border-border mb-6 rounded-lg border">
        <div className="border-border text-muted-foreground border-b px-4 py-3 text-xs font-semibold uppercase">
          Documents &amp; Validity
        </div>
        {reg.documents.length === 0 ? (
          <p className="text-muted-foreground px-4 py-6 text-sm">
            No documents.
          </p>
        ) : (
          reg.documents.map((doc) => {
            const expired =
              doc.expiryDate && new Date(doc.expiryDate) < new Date();
            return (
              <div
                key={doc.id}
                className="border-border flex items-center justify-between border-b px-4 py-3 last:border-b-0"
              >
                <div className="flex items-center gap-2">
                  {doc.isVerified ? (
                    <CheckCircle2 className="text-success h-4 w-4" />
                  ) : (
                    <Circle className="text-muted-foreground h-4 w-4" />
                  )}
                  <span className="text-sm font-medium">{doc.type}</span>
                </div>
                <div className="text-right">
                  {doc.expiryDate ? (
                    <span
                      className={`text-sm ${expired ? "text-destructive font-medium" : "text-muted-foreground"}`}
                    >
                      {expired ? "Expired " : "Valid until "}
                      {formatDateWIB(doc.expiryDate)}
                    </span>
                  ) : (
                    <span className="text-muted-foreground text-sm">
                      No expiry set
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {visit.status === "APPROVED" && (
        <div className="border-success-border bg-success-muted mb-6 space-y-3 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <p className="text-success text-xs font-semibold uppercase">
              Authorized zones
            </p>
            <EditVisitZones
              visitId={visit.id}
              zones={zones}
              currentZoneIds={visit.authorizedZones}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {visit.authorizedZones.length > 0 ? (
              visit.authorizedZones.map((z) => (
                <span
                  key={z}
                  className="bg-success text-success-foreground rounded-full px-3 py-0.5 text-xs"
                >
                  {zones.find((zone) => zone.id === z)?.name ?? z}
                </span>
              ))
            ) : (
              <span className="text-muted-foreground text-xs">None</span>
            )}
          </div>
        </div>
      )}

      {visit.status === "PENDING" && (
        <VisitReviewActions visitId={visit.id} zones={zones} />
      )}
    </div>
  );
}
