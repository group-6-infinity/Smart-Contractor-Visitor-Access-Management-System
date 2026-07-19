import AlertsPanel from "@/components/layouts/dashboards/security/alerts-panel";

export default function AlertsPage() {
  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Alerts</h1>
        <p className="text-muted-foreground text-sm">
          Overstay, high-risk visitors, and denied entries.
        </p>
      </div>
      <AlertsPanel />
    </div>
  );
}
