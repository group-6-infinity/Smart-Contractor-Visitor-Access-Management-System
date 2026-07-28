import InformationCard from "@/components/common/information-card";
import { Button } from "@/components/ui/button";
import prisma from "@/lib/prisma";
import {
  ArrowLeft,
  ArrowLeftRight,
  CheckIcon,
  HourglassIcon,
  ShieldX,
  XIcon,
} from "lucide-react";
import Link from "next/link";
import { cookies } from "next/headers";
import EmailVerifyForm from "@/components/common/email-verify-form";
import VisitSection from "@/components/sections/visit-section";
import AuthLayout from "@/components/layouts/auth/auth-layout";
import DocumentBatchReupload from "@/components/common/document-batch-reupload";
import { decryptToken, encryptToken } from "@/lib/token-crypto";
import { getExpiryStatus } from "@/lib/document-status";

export default async function TrackingStatusPage({
  params,
}: {
  params: Promise<{ url: string }>;
}) {
  const { url: encryptedTokenUrl } = await params;
  const rawToken = decryptToken(encryptedTokenUrl);
  const cookieStore = await cookies();

  const registration = rawToken
    ? await prisma.registration.findFirst({
        where: { trackingToken: rawToken },
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
      })
    : null;

  const allZones = await prisma.zone.findMany({
    select: { id: true, name: true },
  });
  const zoneNames = Object.fromEntries(allZones.map((z) => [z.id, z.name]));

  const sessionEmail = cookieStore.get(`track_session_${rawToken}`)?.value;
  const isVerified = registration && sessionEmail === registration.email;

  // Kalau email yang sama juga punya registrasi dgn role lain (CONTRACTOR/VISITOR),
  // kasih link buat pindah lihat status registrasi satunya. Aman karena baru di-query
  // setelah email di halaman ini keverifikasi lewat session cookie, dan buka link
  // registrasi lain tetap butuh verifikasi email terpisah untuk token itu.
  const siblingRegistration = isVerified
    ? await prisma.registration.findFirst({
        where: {
          email: registration.email,
          type: registration.type === "CONTRACTOR" ? "VISITOR" : "CONTRACTOR",
        },
        select: { trackingToken: true, type: true },
      })
    : null;

  return (
    <AuthLayout>
      {!registration ? (
        <InvalidToken />
      ) : !isVerified ? (
        <EmailVerifyForm token={rawToken!} />
      ) : (
        <ValidToken
          data={registration}
          tokenUrl={rawToken!}
          displayTokenUrl={encryptedTokenUrl}
          zoneNames={zoneNames}
          sibling={siblingRegistration}
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
  visitToken: string;
  status: string;
  authorizedZones: string[];
  CheckEvent: CheckEventData[];
}

function formatReadableDate(date: Date) {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// Butuh update kalau expired/expiring, atau kalau belum verified tapi dokumen
// lain di registrasi yang sama sudah verified (artinya ini sudah direview dan
// ditolak staff, bukan sekadar belum sempat dicek).
//
// Registrasi REJECTED: semua dokumen boleh diganti. Alasan penolakan ditulis
// bebas oleh HSE dan tidak terikat ke dokumen tertentu, jadi tidak ada cara
// menebak mana yang bermasalah — mengunci sebagian bikin pemohon mentok tanpa
// jalan keluar selain daftar ulang dari nol.
function isEligibleForUpdate(
  doc: DocData,
  allDocs: DocData[],
  registrationStatus: string,
): boolean {
  if (registrationStatus === "REJECTED") return true;
  const status = getExpiryStatus(doc.expiryDate);
  if (status === "EXPIRED" || status === "EXPIRING_SOON") return true;
  if (doc.isVerified) return false;
  return allDocs.some((d) => d.id !== doc.id && d.isVerified);
}

function DocumentStatus({
  documents,
  token,
  registrationStatus,
}: {
  documents: DocData[];
  token: string;
  registrationStatus: string;
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

  const eligibleForUpdate = documents.filter((doc) =>
    isEligibleForUpdate(doc, documents, registrationStatus),
  );

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
          return (
            <div
              key={doc.id}
              className="border-border flex w-full items-center justify-between border-b p-3"
            >
              <p className="uppercase">{doc.type}</p>
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
            </div>
          );
        })}
      </div>

      {/* Update: wajib kalau expired, proaktif kalau expiring soon - dikirim sekaligus dalam satu batch */}
      {eligibleForUpdate.length > 0 && (
        <div className="flex w-full justify-end pt-4">
          <DocumentBatchReupload token={token} documents={eligibleForUpdate} />
        </div>
      )}
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
  displayTokenUrl,
  zoneNames,
  sibling,
}: {
  data: DataProps;
  tokenUrl: string;
  displayTokenUrl: string;
  zoneNames: Record<string, string>;
  sibling: { trackingToken: string; type: string } | null;
}) {
  const { fullName, company, status, rejectionReason, documents, Visit } = data;

  const needsAttention = documents.some((d) =>
    isEligibleForUpdate(d, documents, status),
  );

  const messages: Record<string, string> = {
    PENDING: needsAttention
      ? "Your registration is being reviewed by our HSE team. One or more documents below need your attention before we can continue."
      : "Your registration is being reviewed by our HSE team. You'll receive an update right here no further action is needed for now.",
    REJECTED:
      "You don't need to register again. Update the affected documents below and submit them. Your registration goes straight back to our HSE team for review.",
  };

  const hasExpired = documents.some(
    (d) => getExpiryStatus(d.expiryDate) === "EXPIRED",
  );

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col items-center justify-center gap-10 p-4">
      <Link
        href="/track-status"
        className="text-muted-foreground hover:text-foreground -mb-4 flex w-full items-center gap-2 text-sm"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to tracking search
      </Link>

      <div className="profile__header flex w-full flex-col-reverse items-start justify-between max-sm:gap-4 sm:flex-row sm:items-end">
        <div className="space-y-1.75">
          {/* <p className="text-muted-foreground text-sm">
            Tracking ID:{" "}
            <span className="font-semibold">{displayTokenUrl}</span>
          </p> */}
          <h2 className="text-3xl font-semibold uppercase">{fullName}</h2>
          <p className="text-muted-foreground uppercase">{company}</p>
        </div>
        <RegisStatusInfo status={status} />
      </div>

      {sibling && (
        <Link
          href={`/track-status/${encryptToken(sibling.trackingToken)}`}
          className="text-muted-foreground hover:text-primary -mt-6 flex w-full items-center gap-1.5 text-sm underline underline-offset-4"
        >
          <ArrowLeftRight className="h-3.5 w-3.5" />
          Switch to your {sibling.type.toLowerCase()} registration
        </Link>
      )}

      {rejectionReason && status === "REJECTED" && (
        <p className="text-destructive border-destructive-border w-full rounded-md border border-dashed p-3">
          {rejectionReason}
        </p>
      )}

      {status === "PENDING" && (
        <InformationCard message={messages["PENDING"]} />
      )}

      {status === "REJECTED" && (
        <InformationCard message={messages["REJECTED"]} />
      )}

      {/* REJECTED ikut di sini: mengganti dokumen mengembalikan registrasi ke
          antrean review, jadi pemohon tidak perlu mengulang dari formulir
          kosong hanya karena satu berkas ditolak. */}
      {(status === "PENDING" ||
        status === "APPROVED" ||
        status === "REJECTED") && (
        <>
          <DocumentStatus
            documents={documents}
            token={tokenUrl}
            registrationStatus={status}
          />

          {/* Warning kalau ada dokumen expired */}
          {hasExpired && status !== "REJECTED" && (
            <div className="border-destructive-border bg-destructive-muted text-destructive w-full rounded-md border p-4 text-sm">
              <p className="font-semibold">Action required</p>
              <p className="mt-1">
                One or more of your documents has expired. You cannot submit new
                visit requests until the document is updated and re-verified by
                our HSE team.
              </p>
            </div>
          )}

          {status === "APPROVED" && (
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
                  visitToken: v.visitToken,
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
          )}
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
