import RegistrationsTable from "@/components/common/registration-table";
import prisma from "@/lib/prisma";

export default async function RegistrationsPage() {
  const registrations = await prisma.registration.findMany({
    select: {
      id: true,
      trackingToken: true,
      type: true,
      fullName: true,
      company: true,
      email: true,
      status: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  // Blacklist is keyed on the person, not the registration, so it never shows
  // up in `status` — a blacklisted applicant still reads as REJECTED (or even
  // PENDING, if they were blacklisted while under review). Without a marker
  // here a reviewer scanning the queue has no way to tell, and would only find
  // out after opening the detail page.
  const blacklistedEmails = new Set(
    (
      await prisma.blacklist.findMany({
        where: { email: { in: registrations.map((r) => r.email) } },
        select: { email: true },
      })
    ).map((b) => b.email),
  );

  const rows = registrations.map((r) => ({
    ...r,
    isBlacklisted: blacklistedEmails.has(r.email),
    createdAt: r.createdAt.toISOString(),
  }));

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Registrations</h1>
        <p className="text-muted-foreground text-sm">
          Review and approve contractor and visitor registrations.
        </p>
      </div>

      <RegistrationsTable initialRows={rows} />
    </div>
  );
}
