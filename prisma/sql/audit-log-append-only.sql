-- NFR-007: "The audit trail database records shall be protected from
-- deletion or modification by any user, including administrators; only
-- append operations shall be permitted on audit log tables."
--
-- `prisma db push` cannot express triggers, so this file is NOT applied
-- automatically — run it once against the database after every fresh
-- `db push` that (re)creates the AuditLog table:
--
--   npx dotenv -e .env -- npx prisma db execute --file prisma/sql/audit-log-append-only.sql --schema prisma/schema.prisma
--
-- (or paste it into the Neon SQL console). It rejects UPDATE/DELETE on
-- AuditLog at the database level, regardless of role — the application
-- layer never issues these anyway (see lib/audit-log.ts), this is the
-- belt-and-suspenders enforcement for direct DB access too.

CREATE OR REPLACE FUNCTION prevent_audit_log_mutation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'AuditLog is append-only: % is not permitted', TG_OP;
END;
$$ LANGUAGE plpgsql;

-- row-level: blocks UPDATE/DELETE of individual records
DROP TRIGGER IF EXISTS audit_log_no_update ON "AuditLog";
CREATE TRIGGER audit_log_no_update
BEFORE UPDATE OR DELETE ON "AuditLog"
FOR EACH ROW EXECUTE FUNCTION prevent_audit_log_mutation();

-- statement-level: TRUNCATE is a separate trigger event in Postgres and
-- is NOT covered by a row-level UPDATE/DELETE trigger — without this,
-- anyone with table privileges could wipe the entire chain in one
-- statement despite the row-level guard above.
DROP TRIGGER IF EXISTS audit_log_no_truncate ON "AuditLog";
CREATE TRIGGER audit_log_no_truncate
BEFORE TRUNCATE ON "AuditLog"
FOR EACH STATEMENT EXECUTE FUNCTION prevent_audit_log_mutation();
