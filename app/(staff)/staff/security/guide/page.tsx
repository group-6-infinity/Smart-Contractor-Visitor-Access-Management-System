import { SECURITY_GUIDE_STEPS } from "@/const/data/staff-guide-steps";
import StaffGuideStepRow from "@/components/layouts/StaffGuide/guide-step";
import SecurityStatusGrid from "@/components/layouts/StaffGuide/security-status-grid";

export default function SecurityGuidePage() {
  return (
    <main className="mx-auto w-full max-w-2xl p-6 py-10 sm:py-14">
      <div className="space-y-3 text-center">
        <p className="text-primary text-xs font-semibold tracking-[.10em] uppercase md:text-sm md:tracking-[.25em]">
          Security Operator Guide
        </p>
        <h1 className="text-3xl font-bold sm:text-4xl">
          Check-In & Building Watch
        </h1>
        <p className="text-muted-foreground mx-auto max-w-lg text-sm leading-relaxed text-balance md:text-base">
          This is how Security Operators check people in at the gate, keep
          track of who&apos;s inside, and get alerted on watchlisted
          individuals.
        </p>
      </div>

      <p className="text-muted-foreground bg-card border-border mt-7 rounded-lg border p-4 text-sm leading-relaxed">
        For <b className="text-foreground">Security Operators</b> stationed
        at the gate, responsible for verifying arrivals and monitoring
        who&apos;s currently on site.
      </p>

      <div className="mt-2">
        {SECURITY_GUIDE_STEPS.map((step, i) => (
          <StaffGuideStepRow
            key={step.step}
            step={step}
            isLast={i === SECURITY_GUIDE_STEPS.length - 1}
          >
            {step.step === 2 && <SecurityStatusGrid />}
          </StaffGuideStepRow>
        ))}
      </div>

      <footer className="text-muted-foreground mt-10 text-center font-mono text-xs">
        SecureGate · Security Operator Guide
      </footer>
    </main>
  );
}
