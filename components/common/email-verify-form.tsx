"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { ArrowLeft, ShieldCheck } from "lucide-react";

export default function EmailVerifyForm({ token }: { token: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/track/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message ?? "Verification failed");
        return;
      }

      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Link
        href="/track-status"
        className="text-muted-foreground hover:text-foreground mb-2 flex w-full max-w-sm items-center justify-center gap-2 text-sm mx-auto"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to tracking search
      </Link>

      <div className="flex flex-col items-center gap-3 text-center">
        <div className="border-border bg-card flex p-3 items-center justify-center rounded-full border aspect-square">
          <ShieldCheck size={45} className="text-primary" />
        </div>
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold">Verify Your Identity</h1>
          <p className="text-muted-foreground">
            Enter the email you used to register to view this status.
          </p>
        </div>
      </div>

      <div className="w-full max-w-sm space-y-3">
        <Field>
          <FieldLabel htmlFor="email" className="text-muted-foreground">
            Email
          </FieldLabel>
          <Input
            id="email"
            type="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleVerify(e);
            }}
            disabled={loading}
            required
            className="w-full rounded-md py-6!"
          />
        </Field>

        {error && <FieldError className="text-sm italic">{error}</FieldError>}

        <Button
          className="w-full mt-4 cursor-pointer"
          onClick={handleVerify}
          disabled={loading || !email}
        >
          {loading ? "Verifying..." : "Verify"}
        </Button>
      </div>
    </>
  );
}
