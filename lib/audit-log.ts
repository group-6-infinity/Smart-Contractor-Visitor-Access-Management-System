// FR-006 / BR-003 / NFR-007 — immutable, SHA-256 hash-chained audit trail.
//
// Each entry's hash covers its own fields *and* the previous entry's hash,
// so altering or deleting any past row (bypassing the DB trigger somehow,
// e.g. a restore from an untampered backup vs a tampered one) makes every
// hash after it fail to recompute — that's what verifyAuditChain() checks.
//
// Appends are serialized with a Postgres advisory lock so two concurrent
// requests can't both read the same "last hash" and create two entries
// that both claim to follow it (a fork in the chain).
import crypto from "crypto";
import prisma from "./prisma";

export const GENESIS_HASH = "0".repeat(64);

// arbitrary fixed key — just needs to be the same everywhere this is called
const AUDIT_LOCK_KEY = BigInt(887711);

export type AuditAction =
  | "CHECK_IN"
  | "CHECK_IN_OVERRIDE"
  | "CHECK_IN_DENIED"
  | "CHECK_OUT"
  | "BLACKLIST_BLOCKED"
  | "REGISTRATION_APPROVED"
  | "REGISTRATION_REJECTED"
  | "VISIT_APPROVED"
  | "VISIT_REJECTED"
  | "BLACKLIST_ADDED"
  | "BLACKLIST_REMOVED"
  | "STAFF_CREATED"
  | "STAFF_UPDATED";

interface AppendAuditLogInput {
  action: AuditAction;
  actorId?: string | null;
  actorEmail?: string | null;
  targetType?: string | null;
  targetId?: string | null;
  metadata?: Record<string, unknown> | null;
}

function computeHash(fields: {
  prevHash: string;
  action: string;
  actorId: string;
  targetType: string;
  targetId: string;
  metadataJson: string;
  createdAtIso: string;
}) {
  const payload = [
    fields.prevHash,
    fields.action,
    fields.actorId,
    fields.targetType,
    fields.targetId,
    fields.metadataJson,
    fields.createdAtIso,
  ].join("|");
  return crypto.createHash("sha256").update(payload).digest("hex");
}

export async function appendAuditLog(input: AppendAuditLogInput) {
  return prisma.$transaction(async (tx) => {
    // serialize appends so the hash chain can't fork under concurrency
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(${AUDIT_LOCK_KEY})`;

    const last = await tx.auditLog.findFirst({
      orderBy: { createdAt: "desc" },
      select: { hash: true },
    });
    const prevHash = last?.hash ?? GENESIS_HASH;

    const createdAt = new Date();
    const actorId = input.actorId ?? "";
    const targetType = input.targetType ?? "";
    const targetId = input.targetId ?? "";
    const metadataJson = JSON.stringify(input.metadata ?? null);

    const hash = computeHash({
      prevHash,
      action: input.action,
      actorId,
      targetType,
      targetId,
      metadataJson,
      createdAtIso: createdAt.toISOString(),
    });

    return tx.auditLog.create({
      data: {
        action: input.action,
        actorId: input.actorId ?? null,
        actorEmail: input.actorEmail ?? null,
        targetType: input.targetType ?? null,
        targetId: input.targetId ?? null,
        metadata: metadataJson,
        prevHash,
        hash,
        createdAt,
      },
    });
  });
}

export interface AuditChainVerification {
  valid: boolean;
  totalChecked: number;
  brokenAtId: string | null;
  reason: string | null;
}

// Recomputes every hash from genesis and confirms it matches what's
// stored, and that each row's prevHash matches the prior row's hash.
// Satisfies Acceptance Criterion #4 ("SHA-256 hash verification passes
// for all records").
export async function verifyAuditChain(): Promise<AuditChainVerification> {
  const rows = await prisma.auditLog.findMany({
    orderBy: { createdAt: "asc" },
  });

  let expectedPrevHash = GENESIS_HASH;

  for (const row of rows) {
    if (row.prevHash !== expectedPrevHash) {
      return {
        valid: false,
        totalChecked: rows.length,
        brokenAtId: row.id,
        reason: `Record ${row.id} has prevHash that doesn't match the preceding record's hash — chain is broken or a record was inserted out of order.`,
      };
    }

    const recomputed = computeHash({
      prevHash: row.prevHash,
      action: row.action,
      actorId: row.actorId ?? "",
      targetType: row.targetType ?? "",
      targetId: row.targetId ?? "",
      metadataJson: row.metadata,
      createdAtIso: row.createdAt.toISOString(),
    });

    if (recomputed !== row.hash) {
      return {
        valid: false,
        totalChecked: rows.length,
        brokenAtId: row.id,
        reason: `Record ${row.id}'s stored hash doesn't match its recomputed hash — the record was modified after creation.`,
      };
    }

    expectedPrevHash = row.hash;
  }

  return {
    valid: true,
    totalChecked: rows.length,
    brokenAtId: null,
    reason: null,
  };
}
