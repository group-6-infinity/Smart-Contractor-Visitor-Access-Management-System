import QRCode from "qrcode";
import { pendingEmailTemplate } from "@/components/sections/emails/pending";
import { approvedEmailTemplate } from "@/components/sections/emails/approved";
import { rejectedEmailTemplate } from "@/components/sections/emails/rejected";
import nodemailer from "nodemailer";
import { blacklistEmailTemplate } from "@/components/sections/emails/blacklisted";
import {
  visitApprovedEmailTemplate,
  visitRejectedEmailTemplate,
} from "@/components/sections/emails/visit-status";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

type RegistrationStatus = "PENDING" | "APPROVED" | "REJECTED";

type EmailTemplateParams = {
  fullName: string;
  trackingToken: string;
  trackingUrl: string;
  type: string;
  reason?: string;
};

const EMAIL_CONFIG: Record<
  RegistrationStatus,
  {
    subject: string;
    template: (params: EmailTemplateParams) => string;
  }
> = {
  PENDING: {
    subject: "Registration Received — SecureGate",
    template: pendingEmailTemplate,
  },
  APPROVED: {
    subject: "Registration Approved — SecureGate",
    template: approvedEmailTemplate,
  },
  REJECTED: {
    subject: "Registration Update — SecureGate",
    template: rejectedEmailTemplate,
  },
};

export async function sendRegistrationEmail({
  to,
  fullName,
  trackingToken,
  type,
  status = "PENDING",
  reason,
}: {
  to: string;
  fullName: string;
  trackingToken: string;
  type: string;
  status?: RegistrationStatus;
  reason?: string;
}) {
  const trackingUrl = `${process.env.NEXT_PUBLIC_APP_URL}/track-status/${trackingToken}`;
  const { subject, template } = EMAIL_CONFIG[status];

  await transporter.sendMail({
    from: `"SecureGate" <${process.env.GMAIL_USER}>`,
    to,
    subject,
    html: template({ fullName, trackingToken, trackingUrl, type, reason }),
  });
}

export async function sendBlacklistEmail({
  to,
  fullName,
  reason,
}: {
  to: string;
  fullName: string;
  reason: string;
}) {
  await transporter.sendMail({
    from: `"SecureGate" <${process.env.GMAIL_USER}>`,
    to,
    subject: "Access Restriction Notice — SecureGate",
    html: blacklistEmailTemplate({ fullName, reason }),
  });
}

export async function sendVisitStatusEmail({
  to,
  fullName,
  status,
  purpose,
  visitDate,
  trackingToken,
  reason,
}: {
  to: string;
  fullName: string;
  status: "APPROVED" | "REJECTED";
  purpose: string;
  visitDate: Date;
  trackingToken: string;
  reason?: string;
}) {
  const trackingUrl = `${process.env.NEXT_PUBLIC_APP_URL}/track-status/${trackingToken}`;
  const visitDateStr = new Date(visitDate).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const approved = status === "APPROVED";

  if (approved) {
    // generate QR (value = trackingToken, sama kaya gate pass web) jadi PNG buffer
    const qrBuffer = await QRCode.toBuffer(trackingToken, {
      type: "png",
      width: 300,
      margin: 2,
      errorCorrectionLevel: "M",
    });

    await transporter.sendMail({
      from: `"SecureGate" <${process.env.GMAIL_USER}>`,
      to,
      subject: "Visit Request Approved — SecureGate",
      html: visitApprovedEmailTemplate({
        fullName,
        purpose,
        visitDateStr,
        trackingUrl,
        token: trackingToken,
      }),
      attachments: [
        {
          filename: "gate-pass-qr.png",
          content: qrBuffer,
          cid: "gatepassqr", // di-reference di HTML: src="cid:gatepassqr"
        },
      ],
    });
    return;
  }

  // rejected — tanpa QR
  await transporter.sendMail({
    from: `"SecureGate" <${process.env.GMAIL_USER}>`,
    to,
    subject: "Visit Request Update — SecureGate",
    html: visitRejectedEmailTemplate({
      fullName,
      purpose,
      visitDateStr,
      trackingUrl,
      reason,
    }),
  });
}
