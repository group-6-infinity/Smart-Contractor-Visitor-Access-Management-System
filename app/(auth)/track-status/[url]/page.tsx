import InformationCard from "@/components/common/information-card";
import { Button } from "@/components/ui/button";
import prisma from "@/lib/prisma";
import { CheckIcon, HourglassIcon, ShieldX, XIcon } from "lucide-react";
import Link from "next/link";
import { cookies } from "next/headers";
import EmailVerifyForm from "@/components/common/email-verify-form";
import VisitSection from "@/components/sections/visit-section";
import AuthLayout from "@/components/layouts/auth/auth-layout";
import DocumentReupload from "@/components/common/document-reupload";

export default async function TrackingStatusPage({
  params,
}: {
  params: Promise<{ url: string }>;
}) {
  const { url: tokenUrl } = await params;
  const cookieStore = await cookies();

  const registration = await prisma.registration.findFirst({
    where: { trackingToken: tokenUrl },
    include: {
      documents: {
        where: { isActive: true },
        select: {
          id: true,
          type: true,
          expiryDate: true,
          isVerified: true,
        },
      },
      Visit: {
        orderBy: { createdAt: "desc" },
        include: {
          CheckEvent: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: {
              status: true,
              overrideJustification: true,
              checkInAt: true,
              checkOutAt: true,
            },
          },
        },
      },
    },
  });

  const allZones = await prisma.zone.findMany({
    select: { id: true, name: true },
  });
  const zoneNames = Object.fromEntries(allZones.map((z) => [z.id, z.name]));

  const sessionEmail = cookieStore.get(`track_session_${tokenUrl}`)?.value;
  const isVerified = registration && sessionEmail === registration.email;

  return (
    <AuthLayout>
      {!registration ? (
        <InvalidToken />
      ) : !isVerified ? (
        <EmailVerifyForm token={tokenUrl} />
      ) : (
        <ValidToken
          data={registration}
          tokenUrl={tokenUrl}
          zoneNames={zoneNames}
        />
      )}
    </AuthLayout>
  );
}

interface DocData {
  id: string;
  type: string;
  expiryDate: Date | null;
  isVerified: boolean;
}

interface CheckEventData {
  status: string;
  overrideJustification: string | null;
  checkInAt: Date;
  checkOutAt: Date | null;
}

interface VisitData {
  id: string;
  purpose: string;
  visitDate: Date;
  windowStart: Date;
  windowEnd: Date;
  status: string;
  authorizedZones: string[];
  CheckEvent: CheckEventData[];
}

function getExpiryStatus(expiryDate: Date | null): string {
  if (!expiryDate) return "NO_EXPIRY";
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const diff = Math.ceil(
    (new Date(expiryDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (diff < 0) return "EXPIRED";
  if (diff <= 30) return "EXPIRING_SOON";
  return "VALID";
}

function formatReadableDate(date: Date) {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function DocumentStatus({
  documents,
  token,
}: {
  documents: DocData[];
  token: string;
}) {
  if (documents.length === 0) {
    return (
      <div className="w-full">
        <p className="border-border text-muted-foreground border-b pb-3 uppercase">
          document status
        </p>
        <p className="text-muted-foreground py-6 text-center text-sm">
          No documents uploaded.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <p className="border-border text-muted-foreground border-b pb-3 uppercase">
        document status
      </p>
      <div className="flex w-full flex-col items-center justify-between">
        {documents.map((doc) => {
          const status = getExpiryStatus(doc.expiryDate);
          const expired = status === "EXPIRED";
          const expiringSoon = status === "EXPIRING_SOON";
          const canUpdate = expired || expiringSoon;
          return (
            <div
              key={doc.id}
              className="border-border flex w-full items-center justify-between border-b p-3"
            >
              <p className="uppercase">{doc.type}</p>
              <div className="flex items-center gap-3">
                <p
                  className={`text-sm font-medium ${
                    expired
                      ? "text-destructive"
                      : expiringSoon
                        ? "text-primary"
                        : "text-muted-foreground"
                  }`}
                >
                  {doc.isVerified ? "Verified" : "Unverified"}
                  {doc.expiryDate
                    ? ` · ${
                        expired
                          ? "Expired "
                          : expiringSoon
                            ? "Expiring "
                            : "Valid until "
                      }${formatReadableDate(doc.expiryDate)}`
                    : " · No expiry"}
                </p>
                {/* Update: wajib kalau expired, proaktif kalau expiring soon */}
                {canUpdate && (
                  <DocumentReupload
                    token={token}
                    documentId={doc.id}
                    documentType={doc.type}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RegisStatusInfo({ status }: { status: string }) {
  if (status === "PENDING")
    return (
      <Button className="border-info-border text-info bg-info-muted hover:bg-info-muted! border">
        <HourglassIcon />
        {status}-Review
      </Button>
    );
  if (status === "APPROVED")
    return (
      <Button className="border-success-border text-success bg-success-muted hover:bg-success-muted border">
        <CheckIcon />
        {status}
      </Button>
    );
  if (status === "REJECTED")
    return (
      <Button className="border-destructive text-destructive bg-destructive-muted hover:bg-destructive-muted! border">
        <XIcon />
        {status}
      </Button>
    );
  return null;
}

interface DataProps {
  fullName: string;
  company: string;
  status: string;
  rejectionReason: string | null;
  documents: DocData[];
  Visit: VisitData[];
}

function ValidToken({
  data,
  tokenUrl,
  zoneNames,
}: {
  data: DataProps;
  tokenUrl: string;
  zoneNames: Record<string, string>;
}) {
  const { fullName, company, status, rejectionReason, documents, Visit } = data;

  const messages: Record<string, string> = {
    PENDING:
      "Your registration is being reviewed by our HSE team. You'll receive an update right here no further action is needed for now.",
  };

  const hasExpired = documents.some(
    (d) => getExpiryStatus(d.expiryDate) === "EXPIRED",
  );

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col items-center justify-center gap-10 p-4">
      <div className="profile__header flex w-full flex-col-reverse items-start justify-between max-sm:gap-4 sm:flex-row sm:items-end">
        <div className="space-y-1.75">
          <p className="text-muted-foreground text-sm">
            Tracking ID: <span className="font-semibold">{tokenUrl}</span>
          </p>
          <h2 className="text-3xl font-semibold uppercase">{fullName}</h2>
          <p className="text-muted-foreground uppercase">{company}</p>
        </div>
        <RegisStatusInfo status={status} />
      </div>

      {rejectionReason && status === "REJECTED" && (
        <p className="text-destructive border-destructive-border w-full rounded-md border border-dashed p-3">
          {rejectionReason}
        </p>
      )}

      {status === "PENDING" && (
        <InformationCard message={messages["PENDING"]} />
      )}

      {status === "APPROVED" && (
        <>
          <DocumentStatus documents={documents} token={tokenUrl} />

          {/* Warning kalau ada dokumen expired */}
          {hasExpired && (
            <div className="border-destructive-border bg-destructive-muted text-destructive w-full rounded-md border p-4 text-sm">
              <p className="font-semibold">Action required</p>
              <p className="mt-1">
                One or more of your documents has expired. You cannot submit new
                visit requests until the document is updated and re-verified by
                our HSE team.
              </p>
            </div>
          )}

          <VisitSection
            token={tokenUrl}
            visitDisabled={hasExpired}
            initialVisits={Visit.map((v) => {
              const lastEvent = v.CheckEvent[0];
              return {
                id: v.id,
                purpose: v.purpose,
                visitDate: v.visitDate.toISOString(),
                windowStart: v.windowStart.toISOString(),
                windowEnd: v.windowEnd.toISOString(),
                status: v.status,
                authorizedZones: v.authorizedZones,
                checkStatus: lastEvent?.status ?? null,
                deniedReason:
                  lastEvent?.status === "DENIED"
                    ? lastEvent.overrideJustification
                    : null,
              };
            })}
            documents={documents.map((d) => ({
              type: d.type,
              expiryDate: d.expiryDate ? d.expiryDate.toISOString() : null,
            }))}
            zoneNames={zoneNames}
          />
        </>
      )}
    </div>
  );
}

function InvalidToken() {
  return (
    <div className="flex w-full flex-col items-center justify-center gap-6 py-16 text-center">
      <div className="bg-destructive-muted border-destructive-border flex h-20 w-20 items-center justify-center rounded-full border">
        <ShieldX className="text-destructive h-10 w-10" />
      </div>

      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Invalid Tracking Link</h2>
        <p className="text-muted-foreground max-w-sm text-sm">
          This tracking link is invalid or has expired. Please make sure you are
          using the correct link from your registration confirmation.
        </p>
      </div>

      <Link
        href="/"
        className="text-primary text-sm underline underline-offset-4"
      >
        Back to Home
      </Link>
    </div>
  );
}
