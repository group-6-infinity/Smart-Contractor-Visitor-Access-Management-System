"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";

interface VisitData {
  id: string;
  purpose: string;
  visitDate: string;
  visitToken: string;
  windowStart: string;
  windowEnd: string;
  status: string;
}

interface VisitRequestFormProps {
  token: string;
  onSuccess: (visit: VisitData) => void;
  onCancel: () => void;
}

// tanggal minimal = besok, maksimal = 1 bulan dari hari ini
const getToday = () => {
  const d = new Date();
  // hapus setDate(+1) — pakai hari ini
  return d.toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
};

const getMaxDate = () => {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  return d.toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
};

const minDate = getToday(); // ← hari ini
const maxDate = getMaxDate();

export default function VisitRequestForm({
  token,
  onSuccess,
  onCancel,
}: VisitRequestFormProps) {
  const [visitDate, setVisitDate] = useState("");
  const [purpose, setPurpose] = useState("");
  const [windowStart, setWindowStart] = useState("");
  const [windowEnd, setWindowEnd] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isValid = visitDate && purpose && windowStart && windowEnd;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // validasi tanggal: besok s/d 1 bulan
    const selected = new Date(visitDate);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const min = new Date(now);
    min.setDate(min.getDate());
    const max = new Date(now);
    max.setMonth(max.getMonth() + 1);

    if (selected < min) {
      setError("Visit date must be at least tomorrow.");
      return;
    }
    if (selected > max) {
      setError("Visit date cannot be more than 1 month from today.");
      return;
    }

    // validasi window: end harus setelah start
    if (windowEnd <= windowStart) {
      setError("Window end must be after window start.");
      return;
    }

    setLoading(true);

    try {
      const startDateTime = `${visitDate}T${windowStart}:00+07:00`;
      const endDateTime = `${visitDate}T${windowEnd}:00+07:00`;

      const res = await fetch("/api/visit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          visitDate,
          purpose,
          windowStart: startDateTime,
          windowEnd: endDateTime,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message ?? "Failed to submit visit request");
        return;
      }

      onSuccess(data.data);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="visitDate" className="text-muted-foreground">
            Visit Date <span className="text-destructive">*</span>
          </FieldLabel>
          <Input
            id="visitDate"
            type="date"
            value={visitDate}
            min={minDate}
            max={maxDate}
            onChange={(e) => {
              setVisitDate(e.target.value);
              setError(null);
            }}
            disabled={loading}
            required
            className="border-border rounded-md border py-6! [&::-webkit-calendar-picker-indicator]:invert"
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="purpose" className="text-muted-foreground">
            Visit Purpose <span className="text-destructive">*</span>
          </FieldLabel>
          <Input
            id="purpose"
            type="text"
            placeholder="e.g. Equipment maintenance at Line 3"
            value={purpose}
            onChange={(e) => {
              setPurpose(e.target.value);
              setError(null);
            }}
            disabled={loading}
            required
            className="border-border rounded-md border py-6!"
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="windowStart" className="text-muted-foreground">
            Window Start <span className="text-destructive">*</span>
          </FieldLabel>
          <Input
            id="windowStart"
            type="time"
            value={windowStart}
            onChange={(e) => {
              setWindowStart(e.target.value);
              setError(null);
            }}
            disabled={loading}
            required
            className="border-border rounded-md border py-6! [&::-webkit-calendar-picker-indicator]:invert"
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="windowEnd" className="text-muted-foreground">
            Window End <span className="text-destructive">*</span>
          </FieldLabel>
          <Input
            id="windowEnd"
            type="time"
            value={windowEnd}
            onChange={(e) => {
              setWindowEnd(e.target.value);
              setError(null);
            }}
            disabled={loading}
            required
            className="border-border rounded-md border py-6! [&::-webkit-calendar-picker-indicator]:invert"
          />
        </Field>
      </div>

      {error && <FieldError className="text-sm italic">{error}</FieldError>}

      <div className="flex items-center justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
          className="cursor-pointer"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={loading || !isValid}
          className="cursor-pointer font-semibold disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Submitting..." : "Submit Visit Request"}
        </Button>
      </div>
    </form>
  );
}
