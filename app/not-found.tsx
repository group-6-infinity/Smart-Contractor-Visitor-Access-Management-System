"use client"
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { NotFoundLink } from "@/const/interfaces/not-found-link.interface";
import { NotFoundItems } from "@/const/data/not-found-item";
import { useRouter } from "next/navigation";


export default function NotFound() {
  const {className,showBackground, children, errorCode, title, description, backButtonText, homeButtonText, links} = NotFoundItems
  const router = useRouter()

  return (
    <main
      className={cn(
        "flex h-screen w-full items-start justify-center px-4 py-16 md:items-center md:px-20 md:py-24",
        className,
      )}
    >
      {showBackground && (
        <div className="fixed inset-0 z-0 bg-[image:linear-gradient(to_right,var(--muted-foreground),transparent_1px),linear-gradient(to_bottom,var(--muted-foreground),transparent_1px)] [mask-image:radial-gradient(ellipse_60%_30%_at_50%_0%,black_0%,transparent_100%)] [background-size:32px_32px] opacity-50 md:[mask-image:radial-gradient(ellipse_30%_30%_at_50%_20%,black_0%,transparent_100%)] md:[background-size:48px_48px]" />
      )}

      <section className="z-10 flex flex-col items-center gap-8 md:gap-16">
        {children || (
          <>
            <div className="flex flex-col items-center gap-8 md:gap-12">
              <header className="flex flex-col items-center gap-8">
                <div className="flex gap-4">
                  <Badge
                    variant="outline"
                    className="px-2.5 py-1 text-sm font-medium"
                  >
                    <div className="bg-primary size-2 rounded-full" />
                    {errorCode}
                  </Badge>
                </div>
                <div className="flex flex-col items-center gap-4 md:gap-6">
                  <h1 className="text-center text-4xl font-semibold md:text-6xl">
                    {title}
                  </h1>
                  <p className="text-muted-foreground text-center text-lg md:text-xl">
                    {description}
                  </p>
                </div>
              </header>
              <div className="flex w-full flex-col items-center justify-center gap-3 md:flex-row">
                <Link
                  href="#"
                  onClick={() => router.back()}
                  className={`${buttonVariants({ variant: "outline", size: "lg" })} border-border w-full cursor-pointer border px-10 py-7.5 text-xl font-semibold md:w-fit`}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {backButtonText}
                </Link>
                <Link
                  href="/"
                  className={`${buttonVariants({ size: "lg" })} w-full cursor-pointer px-10 py-7.5 text-xl font-semibold md:w-fit`}
                >
                  {homeButtonText}
                </Link>
              </div>
            </div>

            {links.length > 0 && (
              <div className="flex w-full flex-col divide-y border-t border-b">
                {links.map((link: NotFoundLink) => (
                  <Link
                    href={link.href}
                    key={link.title}
                    className="hover:bg-muted/50 flex flex-col items-start gap-4 p-5 transition-colors md:flex-row md:items-center md:gap-5"
                  >
                    <div className="bg-card rounded-lg border p-2.5 md:p-3">
                      <link.icon className="size-5 md:size-6" />
                    </div>
                    <div className="flex w-full flex-1 gap-5">
                      <div className="flex flex-col gap-1">
                        <div className="text-lg font-semibold">
                          {link.title}
                        </div>
                        <div className="text-muted-foreground">
                          {link.subtitle}
                        </div>
                      </div>
                      <div className="my-auto ml-auto self-start">
                        <ArrowRight className="text-muted-foreground h-4 w-4" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}
