export default function InformationCard({ message }: { message: string }) {
  return (
    <p className="text-muted-foreground border-border rounded-md border border-dashed p-3">
      {message}
    </p>
  );
}
