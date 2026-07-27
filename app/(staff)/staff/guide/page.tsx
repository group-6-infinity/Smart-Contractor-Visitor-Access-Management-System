import { HSE_GUIDE_STEPS } from "@/const/data/staff-guide-steps";
import StaffGuideStepRow from "@/components/layouts/StaffGuide/guide-step";

export default function HseGuidePage() {
  return (
    <main className="mx-auto w-full max-w-2xl p-6 py-10 sm:py-14">
      <div className="space-y-3 text-center">
        <p className="text-primary text-xs font-semibold tracking-[.10em] uppercase md:text-sm md:tracking-[.25em]">
          HSE / HR Guide
        </p>
        <h1 className="text-3xl font-bold sm:text-4xl">
          Reviewing & Approving Access
        </h1>
        <p className="text-muted-foreground mx-auto max-w-lg text-sm leading-relaxed text-balance md:text-base">
          This is how HSE/HR reviews new registrations, verifies documents,
          grants zone access, and monitors who is on site.
        </p>
      </div>

      <p className="text-muted-foreground bg-card border-border mt-7 rounded-lg border p-4 text-sm leading-relaxed">
        For <b className="text-foreground">HSE/HR admins</b> responsible for
        reviewing registrations, approving visit requests, and tracking who is
        currently on site.
      </p>

      <div className="mt-2">
        {HSE_GUIDE_STEPS.map((step, i) => (
          <StaffGuideStepRow
            key={step.step}
            step={step}
            isLast={i === HSE_GUIDE_STEPS.length - 1}
          />
        ))}
      </div>

      <footer className="text-muted-foreground mt-10 text-center font-mono text-xs">
        SecureGate · HSE/HR Guide
      </footer>
    </main>
  );
}
