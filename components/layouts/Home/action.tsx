import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function Action() {
  return (
    <Link
      href="/track-status"
      className={cn(
        buttonVariants({ variant: "outline" }),
        "border-border text-foreground mx-auto mt-8 flex w-max cursor-pointer items-center justify-center rounded-sm border py-5 uppercase",
      )}
    >
      Track registration status
    </Link>
  );
}
