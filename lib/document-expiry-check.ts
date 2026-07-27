import prisma from "@/lib/prisma";
import { sendTelegramMessage } from "@/lib/telegram";
import { createNotification } from "@/lib/notifications";
import { daysUntilExpiry, formatReadableDate } from "@/lib/document-status";
import { NotificationType } from "@/lib/generated/prisma/enums";

// FR-010: notify HSE/HR when a contractor document (BPJS, SIO, SIA) is
// exactly 30, 14, or 7 days from expiry.
//
// This assumes the caller fires once per day without gaps — since
// days-until-expiry decreases by exactly 1 per day, each document only
// ever matches a given threshold on one calendar day, so no separate
// "already notified" bookkeeping is needed for this prototype's scope.
const EXPIRY_THRESHOLDS = [30, 14, 7];

export async function runDocumentExpiryCheck() {
  const documents = await prisma.documents.findMany({
    where: {
      isActive: true,
      expiryDate: { not: null },
      type: { in: ["BPJS", "SIO", "SIA"] },
    },
    select: {
      id: true,
      type: true,
      expiryDate: true,
      Registration: {
        select: { fullName: true, company: true },
      },
    },
  });

  const due = documents.filter((doc) =>
    EXPIRY_THRESHOLDS.includes(daysUntilExpiry(doc.expiryDate) ?? -1),
  );

  for (const doc of due) {
    const days = daysUntilExpiry(doc.expiryDate)!;
    const dateStr = formatReadableDate(doc.expiryDate!);
    const message =
      `⏰ <b>Document Expiring in ${days} day${days === 1 ? "" : "s"}</b>\n\n` +
      `<b>Name:</b> ${doc.Registration.fullName}\n` +
      `<b>Company:</b> ${doc.Registration.company}\n` +
      `<b>Document:</b> ${doc.type}\n` +
      `<b>Expires:</b> ${dateStr}`;

    try {
      await Promise.allSettled([
        sendTelegramMessage("HSE", message),
        sendTelegramMessage("HR", message),
      ]);
    } catch {
      console.error(`[CRON] Telegram notify failed for document ${doc.id}`);
    }

    try {
      await createNotification({
        type: NotificationType.DOCUMENT_EXPIRY,
        title: `${doc.type} expiring in ${days} day${days === 1 ? "" : "s"}`,
        message: `${doc.Registration.fullName} (${doc.Registration.company}), ${doc.type} expires ${dateStr}.`,
      });
    } catch {
      console.error(`[CRON] Notification create failed for document ${doc.id}`);
    }
  }

  return { checked: documents.length, notified: due.length };
}
