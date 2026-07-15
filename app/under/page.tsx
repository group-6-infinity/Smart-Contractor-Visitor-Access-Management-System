import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { ArrowLeft, HardHat } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function UnderConstructionPage() {
  return (
    <main
      className={cn(
        "flex h-screen w-full items-start justify-center px-4 py-16 md:items-center md:px-20 md:py-24",
      )}
    >
      <div className="fixed inset-0 z-0 bg-[image:linear-gradient(to_right,var(--muted-foreground),transparent_1px),linear-gradient(to_bottom,var(--muted-foreground),transparent_1px)] [mask-image:radial-gradient(ellipse_60%_30%_at_50%_0%,black_0%,transparent_100%)] [background-size:32px_32px] opacity-50 md:[mask-image:radial-gradient(ellipse_30%_30%_at_50%_20%,black_0%,transparent_100%)] md:[background-size:48px_48px]" />

      <section className="z-10 flex flex-col items-center gap-8 md:gap-16">
        <div className="flex flex-col items-center gap-8 md:gap-12">
          <header className="flex flex-col items-center gap-8">
            <div className="flex gap-4">
              <Badge
                variant="outline"
                className="px-2.5 py-1 text-sm font-medium"
              >
                <div className="size-2 rounded-full bg-orange-500" />
                Under Construction
              </Badge>
            </div>
            <div className="flex flex-col items-center gap-4 md:gap-6">
              <div className="bg-muted border-border flex items-center justify-center rounded-2xl border p-5">
                <HardHat className="text-muted-foreground size-12" />
              </div>
              <h1 className="text-center text-4xl font-semibold md:text-6xl">
                Page Under Construction
              </h1>
              <p className="text-muted-foreground mx-auto max-w-lg text-center text-lg text-balance md:text-xl">
                This page is still being built. Check back soon we re working
                hard to get it ready for you.
              </p>
            </div>
          </header>
          <div className="flex w-full flex-col items-center justify-center gap-3 md:flex-row">
            <Link
              href="/"
              className={`${buttonVariants({ variant: "outline", size: "lg" })} border-border w-full cursor-pointer border px-10 py-7.5 text-xl font-semibold md:w-fit`}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Link>
          </div>
        </div>

        <div className="flex w-full flex-col divide-y border-t border-b">
          <div className="flex flex-col items-start gap-4 p-5 md:flex-row md:items-center md:gap-5">
            <div className="bg-card rounded-lg border p-2.5 md:p-3">
              <HardHat className="size-5 md:size-6" />
            </div>
            <div className="flex w-full flex-1 gap-5">
              <div className="flex flex-col gap-1">
                <div className="text-lg font-semibold">Coming Soon</div>
                <div className="text-muted-foreground">
                  This feature is actively being developed and will be available
                  in a future release.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
