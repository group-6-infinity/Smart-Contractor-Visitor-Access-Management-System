"use client";

import { useState } from "react";
import { Siren } from "lucide-react";

export default function EvacuationButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/staff/evacuation/generate");
      if (!res.ok) {
        setError("Failed to generate. Try again.");
        return;
      }
      // download PDF
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `evacuation-list-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="border-destructive/40 bg-destructive-muted/40 flex items-center justify-between gap-4 rounded-xl border p-4">
      <div className="flex items-center gap-3">
        <div className="bg-destructive/15 flex h-11 w-11 items-center justify-center rounded-lg">
          <Siren className="text-destructive h-5 w-5" />
        </div>
        <div>
          <p className="font-semibold">Emergency Evacuation List</p>
          <p className="text-muted-foreground text-sm">
            Generate a PDF of everyone currently inside the building.
          </p>
          {error && <p className="text-destructive mt-1 text-xs">{error}</p>}
        </div>
      </div>
      <button
        onClick={handleGenerate}
        disabled={loading}
        className="bg-destructive hover:bg-destructive/90 shrink-0 cursor-pointer rounded-lg px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
      >
        {loading ? "Generating..." : "Generate List"}
      </button>
    </div>
  );
}
