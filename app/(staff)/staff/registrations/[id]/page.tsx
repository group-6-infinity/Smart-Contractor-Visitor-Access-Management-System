import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, HardHat, User, AlertTriangle } from "lucide-react";
import RegistrationReviewActions from "@/components/common/registration-review-actions";
import DocumentVerifyRow from "@/components/common/document-verify-row";
import BlacklistAction from "@/components/layouts/dashboards/blacklist-action";
import { getExpiryStatus } from "@/lib/document-status";

const STATUS_STYLE: Record<string, string> = {
  PENDING: "border-info-border text-info bg-info-muted",
  APPROVED: "border-success-border text-success bg-success-muted",
  REJECTED: "border-destructive text-destructive bg-destructive-muted",
};

export default async function RegistrationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const registration = await prisma.registration.findUnique({
    where: { id },
    include: {
      documents: {
        // Replaced documents stay in the table for audit history — without
        // this filter a re-upload makes its type show up twice, and the
        // superseded row keeps driving expiredDocs and the approve guard.
        where: { isActive: true },
        // id tiebreaker: docs from one submission share an identical
        // createdAt (same transaction), so createdAt alone leaves ties
        // in non-deterministic order across queries.
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        select: {
          id: true,
          type: true,
          expiryDate: true,
          isVerified: true,
        },
      },
    },
  });

  if (!registration) notFound();
  const blacklistEntry = await prisma.blacklist.findFirst({
    where: { email: registration.email },
    select: { id: true, reason: true },
  });

  const expiredDocs = registration.documents.filter(
    (d) => getExpiryStatus(d.expiryDate) === "EXPIRED",
  );

  return (
    <div className="mx-auto max-w-3xl p-8">
      <Link
        href="/staff/registrations"
        className="text-muted-foreground hover:text-foreground mb-6 inline-flex items-center gap-2 text-sm"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to registrations
      </Link>

      <div className="mb-8 flex items-start justify-between">
        <div className="space-y-1">
          <div className="text-muted-foreground flex items-center gap-2 text-xs">
            {registration.type === "CONTRACTOR" ? (
              <HardHat className="h-3.5 w-3.5" />
            ) : (
              <User className="h-3.5 w-3.5" />
            )}
            {registration.type} · {registration.trackingToken}
          </div>
          <h1 className="text-2xl font-semibold uppercase">
            {registration.fullName}
          </h1>
          <p className="text-muted-foreground">{registration.company}</p>
        </div>
        <span
          className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium ${STATUS_STYLE[registration.status]}`}
        >
          {registration.status}
        </span>
      </div>

      {expiredDocs.length > 0 && (
        <div className="border-destructive-border bg-destructive-muted text-destructive mb-6 flex items-start gap-3 rounded-lg border p-4 text-sm">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-semibold">
              {expiredDocs.length} expired document
              {expiredDocs.length === 1 ? "" : "s"}
            </p>
            <p className="mt-0.5">
              {expiredDocs.map((d) => d.type).join(", ")} — please request a
              re-upload or re-verify with a new expiry date before approving.
            </p>
          </div>
        </div>
      )}

      <div className="border-border mb-6 grid grid-cols-2 gap-4 rounded-lg border p-4">
        <div>
          <p className="text-muted-foreground text-xs uppercase">Email</p>
          <p className="text-sm">{registration.email}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs uppercase">Phone</p>
          <p className="text-sm">{registration.phone ?? "-"}</p>
        </div>
      </div>

      <div className="border-border mb-6 rounded-lg border">
        <div className="border-border text-muted-foreground border-b px-4 py-3 text-xs font-semibold uppercase">
          Documents
        </div>
        {registration.documents.length === 0 ? (
          <p className="text-muted-foreground px-4 py-6 text-sm">
            No documents uploaded.
          </p>
        ) : (
          registration.documents.map((doc) => (
            <DocumentVerifyRow
              key={doc.id}
              registrationStatus={registration.status}
              doc={{
                id: doc.id,
                type: doc.type,
                isVerified: doc.isVerified,
                expiryDate: doc.expiryDate
                  ? doc.expiryDate.toISOString()
                  : null,
              }}
            />
          ))
        )}
      </div>

      <div className="mb-6">
        <BlacklistAction
          registrationId={registration.id}
          fullName={registration.fullName}
          isBlacklisted={!!blacklistEntry}
          blacklistId={blacklistEntry?.id}
          blacklistReason={blacklistEntry?.reason}
        />
      </div>

      {registration.status === "REJECTED" && registration.rejectionReason && (
        <div className="border-destructive-border bg-destructive-muted text-destructive mb-6 rounded-lg border p-4 text-sm">
          <p className="mb-1 font-semibold">Rejection reason</p>
          {registration.rejectionReason}
        </div>
      )}

      {registration.status === "PENDING" && (
        <RegistrationReviewActions
          registrationId={registration.id}
          documents={registration.documents.map((d) => ({
            id: d.id,
            type: d.type,
            expiryDate: d.expiryDate ? d.expiryDate.toISOString() : null,
            isVerified: d.isVerified,
          }))}
        />
      )}
    </div>
  );
}
