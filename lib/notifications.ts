import prisma from "@/lib/prisma";
import { NotificationType, NotificationChannel } from "@/lib/generated/prisma/enums";

export async function createNotification({
  type,
  title,
  message,
  channel = NotificationChannel.IN_APP,
}: {
  type: NotificationType;
  title: string;
  message: string;
  channel?: NotificationChannel;
}) {
  return prisma.notification.create({
    data: { type, title, message, channel },
  });
}
