"use client";

import { useState } from "react";
import { MapPin, Users, HardHat, User, X } from "lucide-react";

interface ZonePerson {
  id: string;
  fullName: string;
  company: string;
  type: string;
}

interface Zone {
  id: string;
  name: string;
  riskLevel: string;
}

const RISK_STYLE: Record<string, string> = {
  LOW: "border-success-border text-success bg-success-muted",
  MEDIUM: "border-info-border text-info bg-info-muted",
  HIGH: "border-destructive text-destructive bg-destructive-muted",
  CRITICAL: "border-destructive text-destructive bg-destructive-muted",
};

export default function ZoneOccupancy({
  zones,
  occupancy,
}: {
  zones: Zone[];
  occupancy: Record<string, ZonePerson[]>;
}) {
  const [selectedZone, setSelectedZone] = useState<string | null>(null);

  const selectedPeople = selectedZone ? (occupancy[selectedZone] ?? []) : [];
  const selectedZoneName = zones.find((z) => z.id === selectedZone)?.name;

  return (
    <div className="border-border bg-card rounded-xl border p-6">
      <div className="mb-4">
        <h2 className="font-semibold">Zone occupancy</h2>
        <p className="text-muted-foreground text-sm">
          People authorized in each zone today. Click a zone to see who.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {zones.map((zone) => {
          const people = occupancy[zone.id] ?? [];
          const count = people.length;
          const active = selectedZone === zone.id;
          return (
            <button
              key={zone.id}
              onClick={() => count > 0 && setSelectedZone(active ? null : zone.id)}
              disabled={count === 0}
              className={`flex flex-col items-start gap-2 rounded-lg border p-4 text-left transition-colors disabled:cursor-default disabled:opacity-60 ${
                active
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/40"
              }`}
            >
              <div className="flex w-full items-center justify-between">
                <MapPin className="text-muted-foreground h-4 w-4" />
                <span
                  className={`rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${RISK_STYLE[zone.riskLevel]}`}
                >
                  {zone.riskLevel}
                </span>
              </div>
              <p className="text-sm font-medium">{zone.name}</p>
              <div className="text-muted-foreground flex items-center gap-1 text-sm">
                <Users className="h-3.5 w-3.5" />
                <span className="text-foreground font-semibold">{count}</span>
                {count === 1 ? "person" : "people"}
              </div>
            </button>
          );
        })}
      </div>

      {selectedZone && (
        <div className="border-border mt-4 rounded-lg border p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-medium">{selectedZoneName}</h3>
            <button
              onClick={() => setSelectedZone(null)}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          {selectedPeople.length === 0 ? (
            <p className="text-muted-foreground text-sm">No one in this zone.</p>
          ) : (
            <ul className="space-y-2">
              {selectedPeople.map((p) => (
                <li
                  key={p.id}
                  className="hover:bg-muted/40 flex items-center gap-3 rounded-md px-2 py-2"
                >
                  <div className="bg-muted flex h-8 w-8 items-center justify-center rounded-full">
                    {p.type === "CONTRACTOR" ? (
                      <HardHat className="text-muted-foreground h-4 w-4" />
                    ) : (
                      <User className="text-muted-foreground h-4 w-4" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{p.fullName}</p>
                    <p className="text-muted-foreground text-xs">{p.company}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
