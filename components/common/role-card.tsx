import Link from "next/link";
import { MoveRight, LucideIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function RoleCard({
  role,
  icon: Icon,
}: {
  role: string;
  icon: LucideIcon;
}) {
  return (
    <div className="border-border bg-card space-y-8 rounded-lg border p-4">
      <div
        className={`${role === "contractor" ? "bg-primary/10" : "bg-secondary/10"} border-border flex aspect-square w-14 items-center justify-center rounded-md border p-2`}
      >
        <Icon
          size={30}
          className={`${role === "contractor" ? "text-primary" : "text-secondary"}`}
        />
      </div>

      <div className="role__card__main__content space-y-2">
        <div className="role-card-titles">
          <p className="text-foreground text-xl font-semibold">
            {role.slice(0, 1).toUpperCase() + role.slice(1)} Registration
          </p>
          <p className="text-muted-foreground mt-1 max-w-[90%] text-sm leading-loose">
            {role === "contractor"
              ? "For vendors & workers performing on site jobs, Requires KTP, BPJS, SIO / SIA & Face Photo."
              : "For guests, meetings & official visits. Requires KTP & a face photo for the gate pass."}
          </p>
        </div>
        <Link
          className={cn(
            buttonVariants({
              variant: "ghost",
            }),
            {
              "hover:text-primary/80 text-primary": role === "contractor",
              "hover:text-secondary/80 text-secondary": role === "visitor",
              "group m-0 cursor-pointer p-0 transition-all hover:bg-transparent!": true,
            },
          )}
          href={`${role}/registration`}
        >
          <p>Start Registration</p>
          <MoveRight className="transition group-hover:translate-x-1" />
        </Link>
      </div>
    </div>
  );
}
