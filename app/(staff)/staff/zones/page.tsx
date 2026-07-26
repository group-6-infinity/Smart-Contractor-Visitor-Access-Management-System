import prisma from "@/lib/prisma";
import ZoneTable from "@/components/layouts/dashboards/admin/zone-table";

export default async function ZonesPage() {
  const zones = await prisma.zone.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Zones</h1>
        <p className="text-muted-foreground text-sm">
          Manage facility zones and their risk level, used when assigning
          zone access to approved visit requests.
        </p>
      </div>
      <ZoneTable
        initialZones={zones.map((z) => ({
          ...z,
          createdAt: z.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
