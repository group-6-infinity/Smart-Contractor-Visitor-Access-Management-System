"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export function RegComplete({ token }: { token: string }) {
  const [copyUrl, setCopyUrl] = useState(false);
  const trackingUrl = `${process.env.NEXT_PUBLIC_APP_URL}/track-status/${token}`;

  async function HandleCopy() {
    try {
      await navigator.clipboard.writeText(trackingUrl);

      setCopyUrl(true);

      setTimeout(() => {
        setCopyUrl(false);
      }, 2000);
    } catch {
      console.error("Failed to copy");
    }
  }

  return (
    <div className="bg-muted w-full space-y-4 rounded-md p-4">
      <p className="text-muted-foreground">Your Tracking Link</p>
      <div className="box__input flex items-center gap-4">
        <Input
          className="border-muted-foreground/30 rounded-md border py-6!"
          value={`${process.env.NEXT_PUBLIC_APP_URL}/track-status/${token}`}
          readOnly
        />
        <Button
          onClick={HandleCopy}
          size="lg"
          className="hover:bg-primary! hover:text-primary-foreground! border-muted-foreground/30 cursor-pointer rounded-xl px-6 py-6 font-semibold"
          variant="outline"
        >
          {copyUrl ? "Copied!" : "Copy"}
        </Button>
      </div>
    </div>
  );
}
