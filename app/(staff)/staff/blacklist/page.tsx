import BlacklistList from "@/components/layouts/dashboards/blacklist-list";
import prisma from "@/lib/prisma";

export default async function BlacklistPage() {
  const entries = await prisma.blacklist.findMany({
    orderBy: { createdAt: "desc" },
  });

  const rows = entries.map((e) => ({
    id: e.id,
    fullName: e.fullName,
    email: e.email,
    reason: e.reason,
    registrationId: e.registrationId,
    createdAt: e.createdAt.toISOString(),
  }));

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Blacklist</h1>
        <p className="text-muted-foreground text-sm">
          People blocked from entering. They are automatically denied at
          check-in. To blacklist someone, open their registration detail.
        </p>
      </div>

      <BlacklistList initialEntries={rows} />
    </div>
  );
}
