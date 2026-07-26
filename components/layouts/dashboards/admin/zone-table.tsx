"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldError, FieldLabel, FieldSet } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import CustomDialog from "@/components/common/c-dialog";
import { Plus, Pencil, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDateWIB } from "@/lib/datetime";

const RISK_LEVELS = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
type RiskLevel = (typeof RISK_LEVELS)[number];

const RISK_STYLE: Record<RiskLevel, string> = {
  LOW: "bg-success-muted text-success",
  MEDIUM: "bg-info-muted text-info",
  HIGH: "bg-destructive-muted text-destructive",
  CRITICAL: "bg-destructive text-destructive-foreground",
};

interface ZoneRow {
  id: string;
  name: string;
  description: string | null;
  riskLevel: RiskLevel;
  isActive: boolean;
  createdAt: string;
}

function RiskLevelSelect({
  value,
  onChange,
  id,
  disabled,
}: {
  value: string;
  onChange: (v: RiskLevel) => void;
  id?: string;
  disabled?: boolean;
}) {
  return (
    <div className="relative">
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value as RiskLevel)}
        disabled={disabled}
        className={cn(
          "bg-input/50 text-foreground focus-visible:border-ring focus-visible:ring-ring/30",
          "h-9 w-full min-w-0 appearance-none rounded-3xl border border-transparent px-3 py-1 pr-9 text-base outline-none",
          "transition-[color,box-shadow,background-color] focus-visible:ring-3 md:text-sm",
          "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        )}
      >
        {RISK_LEVELS.map((r) => (
          <option key={r} value={r} className="bg-popover text-foreground">
            {r.charAt(0) + r.slice(1).toLowerCase()}
          </option>
        ))}
      </select>
      <ChevronDown className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2" />
    </div>
  );
}

export default function ZoneTable({
  initialZones,
}: {
  initialZones: ZoneRow[];
}) {
  const router = useRouter();
  const [zones, setZones] = useState(initialZones);
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<ZoneRow | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <CustomDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          title="Add zone"
          description="Create a new facility zone that can be assigned to approved visit requests."
          className="max-w-md"
          trigger={
            <Button className="cursor-pointer gap-1.5">
              <Plus className="h-4 w-4" />
              Add Zone
            </Button>
          }
        >
          <CreateZoneForm
            onCreated={(zone) => {
              setZones((prev) =>
                [...prev, zone].sort((a, b) => a.name.localeCompare(b.name)),
              );
              setCreateOpen(false);
              router.refresh();
            }}
          />
        </CustomDialog>
      </div>

      <div className="border-border overflow-hidden rounded-lg border">
        <div className="bg-muted text-muted-foreground grid grid-cols-[1.4fr_1.8fr_1fr_0.9fr_1fr_0.6fr] gap-4 px-4 py-3 text-xs font-semibold uppercase">
          <span>Name</span>
          <span>Description</span>
          <span>Risk Level</span>
          <span>Status</span>
          <span>Created</span>
          <span></span>
        </div>
        {zones.length === 0 ? (
          <p className="text-muted-foreground py-16 text-center text-sm">
            No zones yet.
          </p>
        ) : (
          zones.map((z, i) => (
            <div
              key={z.id}
              className={`grid grid-cols-[1.4fr_1.8fr_1fr_0.9fr_1fr_0.6fr] items-center gap-4 px-4 py-3 text-sm ${
                i % 2 === 1 ? "bg-muted/20" : ""
              }`}
            >
              <span className="font-medium">{z.name}</span>
              <span className="text-muted-foreground truncate">
                {z.description || "—"}
              </span>
              <Badge className={RISK_STYLE[z.riskLevel]}>
                {z.riskLevel.charAt(0) + z.riskLevel.slice(1).toLowerCase()}
              </Badge>
              <Badge
                variant={z.isActive ? "default" : "outline"}
                className={z.isActive ? "bg-success text-success-foreground" : ""}
              >
                {z.isActive ? "Active" : "Inactive"}
              </Badge>
              <span className="text-muted-foreground text-xs">
                {formatDateWIB(z.createdAt)}
              </span>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setEditing(z)}
                className="cursor-pointer"
                aria-label={`Edit ${z.name}`}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </div>
          ))
        )}
      </div>

      <CustomDialog
        open={!!editing}
        onOpenChange={(open) => !open && setEditing(null)}
        title="Edit zone"
        className="max-w-md"
        trigger={<span />}
      >
        {editing && (
          <EditZoneForm
            zone={editing}
            onSaved={(updated) => {
              setZones((prev) =>
                prev.map((z) => (z.id === updated.id ? updated : z)),
              );
              setEditing(null);
              router.refresh();
            }}
          />
        )}
      </CustomDialog>
    </div>
  );
}

function CreateZoneForm({ onCreated }: { onCreated: (zone: ZoneRow) => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [riskLevel, setRiskLevel] = useState<RiskLevel>("LOW");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/staff/zones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, riskLevel }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? "Failed to create zone");
        return;
      }
      onCreated({ ...data.zone, createdAt: data.zone.createdAt });
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FieldSet>
        <Field>
          <FieldLabel htmlFor="new-zone-name">Name</FieldLabel>
          <Input
            id="new-zone-name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="new-zone-description">
            Description{" "}
            <span className="text-muted-foreground font-normal">
              (optional)
            </span>
          </FieldLabel>
          <Input
            id="new-zone-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={loading}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="new-zone-risk">Risk Level</FieldLabel>
          <RiskLevelSelect
            id="new-zone-risk"
            value={riskLevel}
            onChange={setRiskLevel}
            disabled={loading}
          />
        </Field>
      </FieldSet>
      {error && <FieldError>{error}</FieldError>}
      <Button
        type="submit"
        disabled={loading}
        className="w-full cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Creating..." : "Create zone"}
      </Button>
    </form>
  );
}

function EditZoneForm({
  zone,
  onSaved,
}: {
  zone: ZoneRow;
  onSaved: (zone: ZoneRow) => void;
}) {
  const [name, setName] = useState(zone.name);
  const [description, setDescription] = useState(zone.description ?? "");
  const [riskLevel, setRiskLevel] = useState<RiskLevel>(zone.riskLevel);
  const [isActive, setIsActive] = useState(zone.isActive);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/staff/zones/${zone.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, riskLevel, isActive }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? "Failed to update zone");
        return;
      }
      onSaved({ ...data.zone, createdAt: data.zone.createdAt });
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FieldSet>
        <Field>
          <FieldLabel htmlFor="edit-zone-name">Name</FieldLabel>
          <Input
            id="edit-zone-name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="edit-zone-description">
            Description{" "}
            <span className="text-muted-foreground font-normal">
              (optional)
            </span>
          </FieldLabel>
          <Input
            id="edit-zone-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={loading}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="edit-zone-risk">Risk Level</FieldLabel>
          <RiskLevelSelect
            id="edit-zone-risk"
            value={riskLevel}
            onChange={setRiskLevel}
            disabled={loading}
          />
        </Field>
        <Field orientation="horizontal">
          <input
            id="edit-zone-active"
            type="checkbox"
            checked={isActive}
            disabled={loading}
            onChange={(e) => setIsActive(e.target.checked)}
            className="h-4 w-4"
          />
          <FieldLabel htmlFor="edit-zone-active" className="font-normal">
            Zone active
          </FieldLabel>
        </Field>
      </FieldSet>
      {error && <FieldError>{error}</FieldError>}
      <Button
        type="submit"
        disabled={loading}
        className="w-full cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Saving..." : "Save changes"}
      </Button>
    </form>
  );
}
