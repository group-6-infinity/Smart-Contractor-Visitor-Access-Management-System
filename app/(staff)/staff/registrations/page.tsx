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
      status: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const rows = registrations.map((r) => ({
    ...r,
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
