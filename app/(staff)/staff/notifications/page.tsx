import NotificationCenter from "@/components/layouts/dashboards/notification-center";

export default function NotificationCenterPage() {
  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Notification Center</h1>
        <p className="text-muted-foreground text-sm">
          All system notifications. Filter by type or search.
        </p>
      </div>

      <NotificationCenter />
    </div>
  );
}
