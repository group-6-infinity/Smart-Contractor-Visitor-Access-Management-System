"use client";

import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { ArrowLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { RegistrationItem } from "@/const/interfaces/reg-prop.inteface";
import { statusConfig, typeConfig } from "@/const/data/status-config-item";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function TrackStatusPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [registrations, setRegistrations] = useState<RegistrationItem[] | null>(
    null,
  );
  const [searchedEmail, setSearchedEmail] = useState("");

  async function handleFind() {
    setLoading(true);
    setError(null);
    setRegistrations(null);

    const res = await fetch("/api/track/find", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    if (!res.ok) {
      const err = await res.json();
      setError(err.message);
      setLoading(false);
      return;
    }

    const data = await res.json();
    setRegistrations(data.registrations);
    setSearchedEmail(email);
    setLoading(false);
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center">
      <section className="grid w-full md:grid-cols-[2fr_1fr]">
        <div className="mx-auto flex w-full max-w-2xl flex-col items-center justify-center gap-10 p-4">
          <Link
            className={cn(
              buttonVariants({ variant: "ghost" }),
              "mx-auto flex items-center gap-2",
            )}
            href="/"
          >
            <ArrowLeft />
            Back to home
          </Link>
          <div className="space-y-1 text-center">
            <h1 className="text-2xl font-semibold">Track Registration</h1>
            <p className="text-muted-foreground text-sm">
              {registrations
                ? `Showing results for ${searchedEmail}`
                : "Enter your email address to find your registration status."}
            </p>
          </div>

          {!registrations && (
            <div className="w-full max-w-sm space-y-3">
              <Input
                type="email"
                placeholder="name@example.com"
                className="w-full"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleFind();
                }}
              />
              {error && <p className="text-destructive text-sm">{error}</p>}
              <Button
                className="w-full"
                onClick={handleFind}
                disabled={loading || !email}
              >
                {loading ? "Finding..." : "Find My Registration"}
              </Button>
            </div>
          )}

          {registrations && (
            <div className="grid w-full gap-8 sm:grid-cols-2">
              {registrations.map((reg) => {
                const type = typeConfig[reg.type];
                const status = statusConfig[reg.status];
                const TypeIcon = type.icon;

                return (
                  <Link
                    href={`/track-status/${reg.trackingToken}`}
                    key={reg.trackingToken}
                    className="border-border hover:bg-muted/40 cursorPointer w-full rounded-xl border p-4 text-left transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${type.className}`}
                          >
                            <TypeIcon className="h-3 w-3" />
                            {type.label}
                          </span>
                          <span className="text-muted-foreground font-mono text-xs">
                            {reg.trackingToken}
                          </span>
                        </div>
                        <p className="font-semibold">{reg.fullName}</p>
                        <p className="text-muted-foreground text-sm">
                          {reg.company}
                        </p>
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${status.className}`}
                        >
                          {status.label}
                        </span>
                      </div>
                      <ChevronRight className="text-muted-foreground mt-1 h-4 w-4 shrink-0" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        <figure className="relative h-svh w-full max-md:hidden md:block">
          <Image
            src="/square-background-test.png"
            alt="square background"
            className="object-cover"
            fill
          />
        </figure>
      </section>
    </main>
  );
}
