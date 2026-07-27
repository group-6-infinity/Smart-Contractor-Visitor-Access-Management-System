"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldError, FieldLabel, FieldSet } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import CustomDialog from "@/components/common/c-dialog";
import { Plus, Pencil, Eye, EyeOff, ChevronDown } from "lucide-react";
import { formatDateWIB } from "@/lib/datetime";
import { cn } from "@/lib/utils";

const ROLES = ["SECURITY_OPERATOR", "HSE_ADMIN", "HR_ADMIN", "SYSTEM_ADMIN"] as const;
type StaffRole = (typeof ROLES)[number];

interface StaffUser {
  id: string;
  name: string | null;
  email: string;
  role: StaffRole;
  isActive: boolean;
  createdAt: string;
}

const ROLE_LABEL: Record<StaffRole, string> = {
  SECURITY_OPERATOR: "Security Operator",
  HSE_ADMIN: "HSE Admin",
  HR_ADMIN: "HR Admin",
  SYSTEM_ADMIN: "System Administrator",
};

function RoleSelect({
  value,
  onChange,
  id,
  disabled,
}: {
  value: string;
  onChange: (v: StaffRole) => void;
  id?: string;
  disabled?: boolean;
}) {
  return (
    <div className="relative">
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value as StaffRole)}
        disabled={disabled}
        className={cn(
          "bg-input/50 text-foreground focus-visible:border-ring focus-visible:ring-ring/30",
          "h-9 w-full min-w-0 appearance-none rounded-3xl border border-transparent px-3 py-1 pr-9 text-base outline-none",
          "transition-[color,box-shadow,background-color] focus-visible:ring-3 md:text-sm",
          "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        )}
      >
        {ROLES.map((r) => (
          <option
            key={r}
            value={r}
            className="bg-popover text-foreground"
          >
            {ROLE_LABEL[r]}
          </option>
        ))}
      </select>
      <ChevronDown className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2" />
    </div>
  );
}

function PasswordInput({
  id,
  value,
  onChange,
  disabled,
  required,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  required?: boolean;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Input
        id={id}
        type={visible ? "text" : "password"}
        required={required}
        minLength={8}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="pr-10"
      />
      <Button
        type="button"
        variant="ghost"
        onClick={() => setVisible((v) => !v)}
        className="text-muted-foreground hover:text-foreground absolute! top-1/2 right-3 -translate-y-1/2 cursor-pointer active:-translate-y-1/2!"
        aria-label={visible ? "Hide password" : "Show password"}
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </Button>
    </div>
  );
}

export default function StaffUsersTable({
  initialUsers,
  currentUserId,
}: {
  initialUsers: StaffUser[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [users, setUsers] = useState(initialUsers);
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<StaffUser | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <CustomDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          title="Add staff account"
          description="Create a new Security Operator, HSE Admin, HR Admin, or System Administrator account."
          className="max-w-md"
          trigger={
            <Button className="cursor-pointer gap-1.5">
              <Plus className="h-4 w-4" />
              Add Staff
            </Button>
          }
        >
          <CreateStaffForm
            onCreated={(user) => {
              setUsers((prev) => [user, ...prev]);
              setCreateOpen(false);
              router.refresh();
            }}
          />
        </CustomDialog>
      </div>

      <div className="border-border overflow-hidden rounded-lg border">
        <div className="bg-muted text-muted-foreground grid grid-cols-[1.4fr_1.6fr_1.3fr_0.9fr_1fr_0.6fr] gap-4 px-4 py-3 text-xs font-semibold uppercase">
          <span>Name</span>
          <span>Email</span>
          <span>Role</span>
          <span>Status</span>
          <span>Created</span>
          <span>Actions</span>
        </div>
        {users.length === 0 ? (
          <p className="text-muted-foreground py-16 text-center text-sm">
            No staff accounts yet.
          </p>
        ) : (
          users.map((u, i) => (
            <div
              key={u.id}
              className={`grid grid-cols-[1.4fr_1.6fr_1.3fr_0.9fr_1fr_0.6fr] items-center gap-4 px-4 py-3 text-sm ${
                i % 2 === 1 ? "bg-muted/20" : ""
              }`}
            >
              <span className="font-medium">{u.name || "—"}</span>
              <span className="text-muted-foreground truncate">{u.email}</span>
              <span>{ROLE_LABEL[u.role]}</span>
              <Badge
                variant={u.isActive ? "default" : "outline"}
                className={u.isActive ? "bg-success text-success-foreground" : ""}
              >
                {u.isActive ? "Active" : "Inactive"}
              </Badge>
              <span className="text-muted-foreground text-xs">
                {formatDateWIB(u.createdAt)}
              </span>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setEditing(u)}
                className="cursor-pointer translate-x-3"
                aria-label={`Edit ${u.email}`}
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
        title="Edit staff account"
        className="max-w-md"
        trigger={<span />}
      >
        {editing && (
          <EditStaffForm
            user={editing}
            isSelf={editing.id === currentUserId}
            onSaved={(updated) => {
              setUsers((prev) =>
                prev.map((u) => (u.id === updated.id ? updated : u)),
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

function CreateStaffForm({
  onCreated,
}: {
  onCreated: (user: StaffUser) => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<StaffRole>("SECURITY_OPERATOR");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/staff/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, role, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? "Failed to create staff account");
        return;
      }
      onCreated(data.user);
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
          <FieldLabel htmlFor="new-name">Name</FieldLabel>
          <Input
            id="new-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="new-email">Email</FieldLabel>
          <Input
            id="new-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="new-role">Role</FieldLabel>
          <RoleSelect id="new-role" value={role} onChange={setRole} disabled={loading} />
        </Field>
        <Field>
          <FieldLabel htmlFor="new-password">Initial password</FieldLabel>
          <PasswordInput
            id="new-password"
            required
            value={password}
            onChange={setPassword}
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
        {loading ? "Creating..." : "Create account"}
      </Button>
    </form>
  );
}

function EditStaffForm({
  user,
  isSelf,
  onSaved,
}: {
  user: StaffUser;
  isSelf: boolean;
  onSaved: (user: StaffUser) => void;
}) {
  const [name, setName] = useState(user.name ?? "");
  const [role, setRole] = useState<StaffRole>(user.role);
  const [isActive, setIsActive] = useState(user.isActive);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/staff/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          role,
          isActive,
          ...(password ? { password } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? "Failed to update staff account");
        return;
      }
      onSaved(data.user);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-muted-foreground text-sm">{user.email}</p>
      <FieldSet>
        <Field>
          <FieldLabel htmlFor="edit-name">Name</FieldLabel>
          <Input
            id="edit-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="edit-role">Role</FieldLabel>
          <RoleSelect id="edit-role" value={role} onChange={setRole} disabled={loading} />
        </Field>
        <Field orientation="horizontal">
          <input
            id="edit-active"
            type="checkbox"
            checked={isActive}
            disabled={loading || isSelf}
            onChange={(e) => setIsActive(e.target.checked)}
            className="h-4 w-4"
          />
          <FieldLabel htmlFor="edit-active" className="font-normal">
            Account active
            {isSelf && (
              <span className="text-muted-foreground"> (can&apos;t deactivate your own account)</span>
            )}
          </FieldLabel>
        </Field>
        <Field>
          <FieldLabel htmlFor="edit-password">
            Reset password{" "}
            <span className="text-muted-foreground font-normal">
              (leave blank to keep current)
            </span>
          </FieldLabel>
          <PasswordInput
            id="edit-password"
            value={password}
            onChange={setPassword}
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
        {loading ? "Saving..." : "Save changes"}
      </Button>
    </form>
  );
}
