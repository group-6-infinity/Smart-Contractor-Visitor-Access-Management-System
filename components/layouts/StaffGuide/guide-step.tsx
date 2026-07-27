import { cn } from "@/lib/utils";
import { StaffGuideStep } from "@/const/data/staff-guide-steps";

const fieldVariantClassName = {
  default: "bg-muted text-foreground border-border",
  info: "bg-info-muted text-info-muted-foreground border-info-border",
  success: "bg-success-muted text-success-muted-foreground border-success-border",
  destructive:
    "bg-destructive-muted text-destructive-muted-foreground border-destructive-border",
};

export default function StaffGuideStepRow({
  step,
  isLast,
  children,
}: {
  step: StaffGuideStep;
  isLast: boolean;
  children?: React.ReactNode;
}) {
  const Icon = step.icon;

  return (
    <div className="relative flex gap-4 p-5">
      {!isLast && (
        <div className="border-border absolute top-[76px] bottom-[-14px] left-[44px] w-px border-l" />
      )}
      <div className="bg-primary/10 border-border relative z-10 flex size-14 shrink-0 items-center justify-center rounded-lg border">
        <Icon className="text-primary size-6" />
      </div>
      <div className="flex-1 pt-0.5">
        <div className="text-primary font-mono text-xs font-semibold tracking-wide">
          STEP {step.step}
        </div>
        <h3 className="mt-1 text-base font-semibold">{step.title}</h3>
        <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">
          {step.description}
        </p>

        {step.details && (
          <ul className="text-muted-foreground mt-2 list-disc space-y-1 pl-4.5 text-sm leading-relaxed">
            {step.details.map((detail) => (
              <li key={detail}>{detail}</li>
            ))}
          </ul>
        )}

        {step.fields && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {step.fields.map((field) => (
              <span
                key={field.label}
                className={cn(
                  "rounded-full border px-2.5 py-1 font-mono text-xs",
                  fieldVariantClassName[field.variant ?? "default"],
                )}
              >
                {field.label}
              </span>
            ))}
          </div>
        )}

        {children}
      </div>
    </div>
  );
}
