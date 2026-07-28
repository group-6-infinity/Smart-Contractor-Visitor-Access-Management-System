-- One active document row per (registration, type).
--
-- Re-upload overwrites the existing document row in place (see
-- app/api/track/document/reupload/route.ts) so a registration holds exactly
-- one row per document type. This index is the database-level guarantee of
-- that invariant, and the repair below cleans up rows left over from the
-- earlier design, which retired the old row (isActive = false) and inserted
-- a replacement — every re-upload grew the table, and any query that forgot
-- to filter isActive listed the same document type twice.
--
-- `prisma db push` cannot express a partial (filtered) unique index, so this
-- file is NOT applied automatically — run it once after a fresh `db push`:
--
--   npx dotenv -e .env -- npx prisma db execute --file prisma/sql/documents-single-active.sql --schema prisma/schema.prisma
--
-- (or paste it into the Neon SQL console). It is idempotent and safe to
-- re-run. Same convention as prisma/sql/audit-log-append-only.sql.

-- Repair first: the index cannot be created while duplicates exist. Keep the
-- newest active row per (registrationId, type) and retire the rest.
--
-- Rows already retired by the old design are left untouched: they carry the
-- history of what was submitted before, and every application query filters
-- on isActive so they stay out of the way. Purging them (and their blobs) is
-- a separate decision, not something this file makes for you.
WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY "registrationId", "type"
      ORDER BY "createdAt" DESC, id DESC
    ) AS rn
  FROM "documents"
  WHERE "isActive"
)
UPDATE "documents" d
SET "isActive" = false,
    "replacedAt" = COALESCE(d."replacedAt", now())
FROM ranked
WHERE d.id = ranked.id
  AND ranked.rn > 1;

-- Enforce going forward. Partial index: inactive rows are unconstrained, so
-- the historical rows above never conflict with it.
CREATE UNIQUE INDEX IF NOT EXISTS documents_one_active_per_type
ON "documents" ("registrationId", "type")
WHERE "isActive";
