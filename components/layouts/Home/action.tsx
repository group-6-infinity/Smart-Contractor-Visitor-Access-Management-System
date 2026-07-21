import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { HelpCircle } from "lucide-react";
import Link from "next/link";

export default function Action() {
  return (
    <div className="mx-auto mt-8 flex w-max flex-wrap items-center justify-center gap-3">
      <Link
        href="/track-status"
        className={cn(
          buttonVariants({ variant: "outline" }),
          "border-border text-foreground flex cursor-pointer items-center justify-center rounded-sm border py-5 uppercase",
        )}
      >
        Track registration status
      </Link>
      <Link
        href="/user-guidance"
        className={cn(
          buttonVariants({ variant: "ghost" }),
          "text-muted-foreground hover:text-foreground flex cursor-pointer items-center justify-center gap-1.5 rounded-sm py-5 uppercase",
        )}
      >
        <HelpCircle className="size-4" />
        How to register
      </Link>
    </div>
  );
}
