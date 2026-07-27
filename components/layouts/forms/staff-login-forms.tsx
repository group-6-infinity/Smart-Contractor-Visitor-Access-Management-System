"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldError, FieldLabel, FieldSet } from "@/components/ui/field";
import { ArrowLeft, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import AuthLayout from "../auth/auth-layout";

export default function StaffLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/staff/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? "Invalid email or password");
        return;
      }
      router.push("/staff/dashboard");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout>
      <div className="mx-auto flex w-full max-w-sm flex-col items-center justify-center space-y-8">
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

        {/* Header */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="border-border bg-card flex h-12 w-12 items-center justify-center rounded-xl border">
            <ShieldCheck className="text-primary h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h1 className="text-xl font-semibold">Staff Portal</h1>
            <p className="text-muted-foreground text-sm">
              Sign in to access the SecureGate dashboard
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="w-full space-y-4">
          <FieldSet>
            <Field>
              <FieldLabel htmlFor="email" className="text-muted-foreground">
                Email
              </FieldLabel>
              <Input
                id="email"
                type="email"
                placeholder="staff@company.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError(null);
                }}
                disabled={loading}
                autoComplete="email"
                required
                className="border-border w-full rounded-md border py-6!"
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="password" className="text-muted-foreground">
                Password
              </FieldLabel>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(null);
                  }}
                  disabled={loading}
                  autoComplete="current-password"
                  required
                  className="border-border w-full rounded-md border py-6! pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowPassword((v) => !v)}
                  className="text-muted-foreground hover:text-foreground absolute! top-1/2 right-3 -translate-y-1/2 cursor-pointer active:-translate-y-1/2!"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </Field>
          </FieldSet>

          {error && <FieldError className="text-sm italic">{error}</FieldError>}

          <Button
            type="submit"
            size="lg"
            disabled={loading || !email || !password}
            className="w-full cursor-pointer rounded-md py-6 text-base font-semibold disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        {/* Footer */}
        <p className="text-muted-foreground text-center text-xs">
          This portal is restricted to authorized staff only.
        </p>
      </div>
    </AuthLayout>
    // <div className="flex min-h-screen items-center justify-center">
    //   <section className="grid w-full grid-cols-[2fr_1fr]">
    //     <div className="mx-auto flex w-full max-w-sm flex-col items-center justify-center space-y-8">
    //       {/* Header */}
    //       <div className="flex flex-col items-center gap-3 text-center">
    //         <div className="border-border bg-card flex h-12 w-12 items-center justify-center rounded-xl border">
    //           <ShieldCheck className="text-primary h-6 w-6" />
    //         </div>
    //         <div className="space-y-1">
    //           <h1 className="text-xl font-semibold">Staff Portal</h1>
    //           <p className="text-muted-foreground text-sm">
    //             Sign in to access the SecureGate dashboard
    //           </p>
    //         </div>
    //       </div>

    //       {/* Form */}
    //       <form onSubmit={handleSubmit} className="w-full space-y-4">
    //         <FieldSet>
    //           <Field>
    //             <FieldLabel htmlFor="email" className="text-muted-foreground">
    //               Email
    //             </FieldLabel>
    //             <Input
    //               id="email"
    //               type="email"
    //               placeholder="staff@company.com"
    //               value={email}
    //               onChange={(e) => {
    //                 setEmail(e.target.value);
    //                 setError(null);
    //               }}
    //               disabled={loading}
    //               autoComplete="email"
    //               required
    //               className="border-border w-full rounded-md border py-6!"
    //             />
    //           </Field>

    //           <Field>
    //             <FieldLabel
    //               htmlFor="password"
    //               className="text-muted-foreground"
    //             >
    //               Password
    //             </FieldLabel>
    //             <div className="relative">
    //               <Input
    //                 id="password"
    //                 type={showPassword ? "text" : "password"}
    //                 placeholder="••••••••"
    //                 value={password}
    //                 onChange={(e) => {
    //                   setPassword(e.target.value);
    //                   setError(null);
    //                 }}
    //                 disabled={loading}
    //                 autoComplete="current-password"
    //                 required
    //                 className="border-border w-full rounded-md border py-6! pr-10"
    //               />
    //               <Button
    //                 type="button"
    //                 variant="ghost"
    //                 onClick={() => setShowPassword((v) => !v)}
    //                 className="text-muted-foreground hover:text-foreground absolute! top-1/2 right-3 -translate-y-1/2 cursor-pointer active:-translate-y-1/2!"
    //                 aria-label={
    //                   showPassword ? "Hide password" : "Show password"
    //                 }
    //               >
    //                 {showPassword ? (
    //                   <EyeOff className="h-4 w-4" />
    //                 ) : (
    //                   <Eye className="h-4 w-4" />
    //                 )}
    //               </Button>
    //             </div>
    //           </Field>
    //         </FieldSet>

    //         {error && (
    //           <FieldError className="text-sm italic">{error}</FieldError>
    //         )}

    //         <Button
    //           type="submit"
    //           size="lg"
    //           disabled={loading || !email || !password}
    //           className="w-full cursor-pointer rounded-md py-6 text-base font-semibold disabled:cursor-not-allowed disabled:opacity-50"
    //         >
    //           {loading ? "Signing in..." : "Sign In"}
    //         </Button>
    //       </form>

    //       {/* Footer */}
    //       <p className="text-muted-foreground text-center text-xs">
    //         This portal is restricted to authorized staff only.
    //       </p>
    //     </div>

    //     <figure className="relative block h-svh w-full">
    //       <Image
    //         src="/square-background-test.png"
    //         alt="square background"
    //         className="object-cover"
    //         fill
    //       />
    //     </figure>
    //   </section>
    // </div>
  );
}
