import VisitsTable from "@/components/layouts/dashboards/visit-table";
import LiveIndicator from "@/components/common/live-indicator";
import prisma from "@/lib/prisma";
export default async function VisitsPage() {
  const visits = await prisma.visit.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      purpose: true,
      visitDate: true,
      windowStart: true,
      windowEnd: true,
      status: true,
      Registration: {
        select: { fullName: true, company: true, type: true },
      },
    },
  });

  const rows = visits.map((v) => ({
    id: v.id,
    purpose: v.purpose,
    visitDate: v.visitDate.toISOString(),
    windowStart: v.windowStart.toISOString(),
    windowEnd: v.windowEnd.toISOString(),
    status: v.status,
    fullName: v.Registration.fullName,
    company: v.Registration.company,
    type: v.Registration.type,
  }));

  return (
    <div className="p-8">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Visit Approvals</h1>
          <p className="text-muted-foreground text-sm">
            Review visit requests and assign authorized zones.
          </p>
        </div>
        <LiveIndicator className="shrink-0 pb-0.5" />
      </div>

      <VisitsTable initialRows={rows} />
    </div>
  );
}
