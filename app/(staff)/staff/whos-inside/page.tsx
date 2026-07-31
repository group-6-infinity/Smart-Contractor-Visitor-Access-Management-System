import WhosInsideTable from "@/components/layouts/dashboards/whos-inside-table";
import EvacuationButton from "@/components/layouts/dashboards/evacuation-button";
import prisma from "@/lib/prisma";
import { isOverstay } from "@/lib/overstay";

export default async function WhosInsidePage() {
  const events = await prisma.checkEvent.findMany({
    where: { status: "INSIDE" },
    orderBy: { checkInAt: "desc" },
    select: {
      id: true,
      checkInAt: true,
      zones: true,
      Registration: {
        select: { fullName: true, company: true, type: true },
      },
      Visit: {
        select: { windowEnd: true, purpose: true },
      },
    },
  });

  const allZones = await prisma.zone.findMany({ select: { id: true, name: true } });
  const zoneNames = Object.fromEntries(allZones.map((z) => [z.id, z.name]));

  const rows = events.map((e) => ({
    id: e.id,
    fullName: e.Registration.fullName,
    company: e.Registration.company,
    type: e.Registration.type,
    zones: e.zones.map((z) => zoneNames[z] ?? z),
    purpose: e.Visit.purpose,
    checkInAt: e.checkInAt.toISOString(),
    windowEnd: e.Visit.windowEnd.toISOString(),
    isOverstay: isOverstay(e.Visit.windowEnd),
  }));

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Who&apos;s Inside</h1>
        <p className="text-muted-foreground text-sm">
          People currently checked in. Check them out when they leave.
        </p>
      </div>

       <div className="mb-6">
        <EvacuationButton />
      </div>

      <WhosInsideTable initialRows={rows} />
    </div>
  );
}
