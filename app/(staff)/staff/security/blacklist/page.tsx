import BlacklistView from "@/components/layouts/dashboards/blacklist-view";

export default function SecurityBlacklistPage() {
  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Watchlist</h1>
        <p className="text-muted-foreground text-sm">
          Blacklisted individuals — automatically denied at check-in.
        </p>
      </div>
      <BlacklistView />
    </div>
  );
}
