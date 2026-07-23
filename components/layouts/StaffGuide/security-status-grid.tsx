import { cn } from "@/lib/utils";
import { SECURITY_STATUSES } from "@/const/data/staff-guide-steps";

const dotColorClassName = {
  success: "bg-success",
  warning: "bg-amber-500",
  destructive: "bg-destructive",
};

export default function SecurityStatusGrid() {
  return (
    <div className="mt-3 space-y-2">
      <div className="grid gap-2.5 sm:grid-cols-3">
        {SECURITY_STATUSES.map((status) => (
          <div
            key={status.label}
            className="border-border bg-card flex items-start gap-2.5 rounded-xl border p-3"
          >
            <div
              className={cn(
                "mt-1.5 size-2.5 shrink-0 rounded-full",
                dotColorClassName[status.color],
              )}
            />
            <div>
              <h4 className="text-sm font-semibold">{status.label}</h4>
              <p className="text-muted-foreground mt-0.5 text-xs leading-relaxed">
                {status.description}
              </p>
            </div>
          </div>
        ))}
      </div>
      <p className="text-muted-foreground text-xs italic">
        Note: a person can be both, e.g. Overstaying and High Risk at once.
      </p>
    </div>
  );
}
