"use client";import { Mail } from "lucide-react";

export function RegComplete() {
  return (
    <div className="bg-muted/40 border-border rounded-lg border p-5 text-left">
      <div className="flex items-start gap-3">
        <Mail className="text-primary mt-0.5 h-5 w-5 shrink-0" />
        <div className="space-y-1">
          <p className="text-sm font-medium">Check your email</p>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Weve sent your tracking link to your registered email address. Use
            it to check your registration status and submit visit requests. If
            you dont see it, please check your spam folder.
          </p>
        </div>
      </div>
    </div>
  );
}
