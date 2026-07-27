import VisitorHistory from "@/components/layouts/dashboards/security/visitor-history";

export default function VisitorHistoryPage() {
  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Visitor History</h1>
        <p className="text-muted-foreground text-sm">
          Search a visitor or contractor by name or company to see their
          past visit and check-in history.
        </p>
      </div>
      <VisitorHistory />
    </div>
  );
}
