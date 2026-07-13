import InformationCard from "@/components/common/information-card";
import { Button } from "@/components/ui/button";
import prisma from "@/lib/prisma";
import { CheckIcon, HourglassIcon, ShieldX, XIcon } from "lucide-react";
import Link from "next/link";
import { cookies } from "next/headers";
import EmailVerifyForm from "@/bak/email-verify-form";
import VisitSection from "@/components/sections/visit-section";
import AuthLayout from "@/components/layouts/auth/auth-layout";

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
      Visit: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  const sessionEmail = cookieStore.get(`track_session_${tokenUrl}`)?.value;
  const isVerified = registration && sessionEmail === registration.email;

  return (
    <AuthLayout>
      {!registration ? (
        <InvalidToken />
      ) : !isVerified ? (
        <EmailVerifyForm token={tokenUrl} />
      ) : (
        <ValidToken data={registration} tokenUrl={tokenUrl} />
      )}
    </AuthLayout>
  );
}

function DocumentStatus() {
  const docs = ["ktp", "bpjs", "sio", "sia"];

  return (
    <div className="w-full">
      <p className="border-border text-muted-foreground border-b pb-3 uppercase">
        document status
      </p>
      <div className="flex w-full flex-col items-center justify-between">
        {docs.map((item) => (
          <div
            key={item}
            className="border-border flex w-full items-center justify-between border-b p-3"
          >
            <p className="">{item}</p>
            <p className="text-muted-foreground text-sm font-medium">
              Valid · -
            </p>
          </div>
        ))}
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

interface VisitData {
  id: string;
  purpose: string;
  visitDate: Date;
  windowStart: Date;
  windowEnd: Date;
  status: string;
  authorizedZones: string[];
}

interface DataProps {
  fullName: string;
  company: string;
  status: string;
  rejectionReason: string | null;
  Visit: VisitData[];
}

function ValidToken({ data, tokenUrl }: { data: DataProps; tokenUrl: string }) {
  const { fullName, company, status, rejectionReason, Visit } = data;

  const messages: Record<string, string> = {
    PENDING:
      "Your registration is being reviewed by our HSE team. You'll receive an update right here no further action is needed for now.",
  };

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col items-center justify-center gap-10 p-4">
      <div className="profile__header flex w-full items-end justify-between">
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
          <DocumentStatus />
          <VisitSection
            token={tokenUrl}
            initialVisits={Visit.map((v) => ({
              id: v.id,
              purpose: v.purpose,
              visitDate: v.visitDate.toISOString(),
              windowStart: v.windowStart.toISOString(),
              windowEnd: v.windowEnd.toISOString(),
              status: v.status,
              authorizedZones: v.authorizedZones,
            }))}
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

      <div className="bg-muted/40 border-border w-full max-w-sm rounded-md border p-4 text-left">
        <p className="text-muted-foreground text-xs">What you can do:</p>
        <ul className="text-muted-foreground mt-2 space-y-1 text-xs">
          <li>• Check your registration confirmation for the correct link</li>
          <li>• Register again if you have not done so</li>
          <li>• Contact the facility HSE team for assistance</li>
        </ul>
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
