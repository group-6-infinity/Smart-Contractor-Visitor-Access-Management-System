import InsideRoster from "@/components/layouts/dashboards/security/inside-roster";

export default function RosterPage() {
  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Who&apos;s Inside</h1>
        <p className="text-muted-foreground text-sm">
          Current visitors on site. Check them out when they leave.
        </p>
      </div>
      <InsideRoster />
    </div>
  );
}
