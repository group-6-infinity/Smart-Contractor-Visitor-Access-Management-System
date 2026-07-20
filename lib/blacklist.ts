import prisma from "@/lib/prisma";

export async function isBlacklisted({
  email,
  registrationId,
}: {
  email?: string;
  registrationId?: string;
}): Promise<{ blocked: boolean; reason?: string }> {
  const entry = await prisma.blacklist.findFirst({
    where: {
      OR: [
        email ? { email: email.toLowerCase() } : {},
        registrationId ? { registrationId } : {},
      ].filter((c) => Object.keys(c).length > 0),
    },
    select: { reason: true },
  });

  if (entry) {
    return { blocked: true, reason: entry.reason };
  }
  return { blocked: false };
}
