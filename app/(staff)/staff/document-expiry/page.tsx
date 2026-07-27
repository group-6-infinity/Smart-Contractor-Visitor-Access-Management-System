import DocumentExpiryMonitor from "@/components/layouts/dashboards/document-expiry-monitor";

export default function DocumentExpiryPage() {
  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Document Expiry Monitor</h1>
        <p className="text-muted-foreground text-sm">
          Track document validity and documents awaiting review.
        </p>
      </div>

      <DocumentExpiryMonitor />
    </div>
  );
}
