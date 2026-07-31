import NotificationCenter from "@/components/layouts/dashboards/notification-center";
import LiveIndicator from "@/components/common/live-indicator";

export default function NotificationCenterPage() {
  return (
    <div className="p-8">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Notification Center</h1>
          <p className="text-muted-foreground text-sm">
            All system notifications and incoming registrations. Filter by type
            or search.
          </p>
        </div>
        <LiveIndicator className="shrink-0 pb-0.5" />
      </div>

      <NotificationCenter />
    </div>
  );
}
