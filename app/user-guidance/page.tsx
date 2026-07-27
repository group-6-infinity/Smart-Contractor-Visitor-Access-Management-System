import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import GuideTabs from "@/components/layouts/UserGuidance/guide-tabs";

export default function UserGuidancePage() {
  return (
    <main className="mx-auto w-full max-w-2xl p-4 py-10 sm:py-14">
      <Link
        href="/"
        className={cn(
          buttonVariants({ variant: "ghost" }),
          "flex w-max mx-auto items-center gap-2",
        )}
      >
        <ArrowLeft />
        Back to home
      </Link>

      <div className="mt-8 space-y-3 text-center">
        <p className="text-primary text-xs font-semibold tracking-[.10em] uppercase md:text-sm md:tracking-[.25em]">
          Registration Guide
        </p>
        <h1 className="text-3xl font-bold sm:text-4xl">How to Register</h1>
        <p className="text-muted-foreground mx-auto max-w-lg text-sm leading-relaxed text-balance md:text-base">
          Follow these steps to complete your pre-registration. The document
          requirements differ for visitors and contractors — pick your role
          below.
        </p>
      </div>

      <div className="mt-8">
        <GuideTabs />
      </div>

      <footer className="text-muted-foreground mt-10 text-center font-mono text-xs">
        SecureGate · Registration Guide
      </footer>
    </main>
  );
}
