# BRD Implementation Status

Tracks the SecureGate BRD (v1.1, June 14, 2026) requirements against what's
actually implemented in this codebase. Last updated: 2026-07-25.

Legend: ✅ Implemented · ⚠️ Partial / simplified · ❌ Not implemented

## Business Requirements

| ID | Description | Status | Notes |
|---|---|---|---|
| BR-001 | Online pre-registration w/ document upload | ✅ | `app/api/register/route.ts` |
| BR-002 | Zone access based on role/visit approval | ✅ | Visit `authorizedZones` + zone name resolution |
| BR-003 | Tamper-proof audit trail for ISO compliance | ✅ | SHA-256 hash-chained `AuditLog`, see FR-006 |
| BR-004 | Real-time visibility of who's inside, which zone, since when | ✅ | `/staff/whos-inside`, `/staff/security/roster` |
| BR-005 | Auto-notify on document expiry | ✅ | FR-010 cron, see below |
| BR-006 | Overstay detection | ✅ | 15-min grace period, `whos-inside/page.tsx` |
| BR-007 | Instant headcount for emergencies | ✅ | Evacuation PDF report |
| BR-008 | Block blacklisted individuals + alert security | ✅ | Hard stop in check-in validate, no override path |

## Functional Requirements

| ID | Description | Status | Notes |
|---|---|---|---|
| FR-001 | Pre-registration form (KTP/BPJS/SIO/SIA) | ✅ | |
| FR-002 | Time-bound QR pass | ✅ | `visitToken` + window validation |
| FR-002A | Two-step check-in: QR then face recognition | ⚠️ | **Team decision (2026-07-25): face recognition intentionally excluded.** Check-in is QR-token validation only (single factor). The registrant's stored photo is shown to the Security Operator for manual visual comparison instead of automated matching. Reason: integrating the Python `face_recognition` library into this Next.js/TypeScript stack would require a separate runtime/service, a webcam capture pipeline, and carries lighting-dependent accuracy risk — assessed as too heavy for the 1-month/4-person-team constraint relative to the benefit over operator-verified photo comparison. |
| FR-003 | RBAC per access point, log every entry attempt | ⚠️ | Zone authorization enforced; logging is per check-in event (one gate), not per individual access point — consistent with hardware/turnstiles being Out-of-Scope (only one virtual gate exists) |
| FR-004 | Automated face recognition | ❌ | Same team decision as FR-002A |
| FR-005 | Risk score LOW/MED/HIGH + first-visit edge case | ✅ | `lib/risk-scoring.ts`, explicitly implements the BRD AC #7 first-visit → MEDIUM + manual review rule |
| FR-006 | Immutable SHA-256 hash-chained audit log | ✅ | `lib/audit-log.ts` + `AuditLog` model. Each entry hashes its own fields + the previous entry's hash; a Postgres trigger blocks UPDATE/DELETE/TRUNCATE on the table at the DB level (not just "the app doesn't do it") — see `prisma/sql/audit-log-append-only.sql`. Wired into check-in, check-out, check-in denial, blacklist block, registration approve/reject, visit approve/reject, blacklist add/remove, and staff account create/update. Viewable at `/staff/admin/audit-log` (System Administrator only) with a live integrity-verification badge. |
| FR-007 | Blacklist blocks non-overridable by anyone | ✅ | Hard stop before override logic even runs |
| FR-008 | Real-time dashboard (name, photo, company, zone, time) | ⚠️ | Name/company/zone/time shown; photo thumbnail not currently rendered on the inside/roster views |
| FR-009 | One-click evacuation PDF, <10s | ✅ | `pdf-lib`-generated report |
| FR-009A | Fallback snapshot independent of main app/DB | ⚠️ | Fallback exists but is stored in the **same Neon database** and refreshed opportunistically (on each successful report generation), not on the BRD's specified 5-minute schedule or as an independent local file. If the DB itself is unreachable (the exact failure mode diagnosed in this project on 2026-07-24), this fallback is unreachable too. Would need a genuinely separate store (local disk / different DB) and a real scheduled refresh to fully satisfy this requirement. |
| FR-010 | Telegram expiry alerts at 30/14/7 days | ✅ | Core check lives in `lib/document-expiry-check.ts`. This project is hosted on a self-managed VPS via SSH + pm2 (see `deploy.sh` / `.github/workflows/deploy-pipeline.yml`), not Vercel, so there's no platform cron — scheduling is done in-process via `node-cron`, registered on server boot through Next.js's `instrumentation.ts` (daily 08:00 WIB). `/api/cron/document-expiry` still exists as a manual/ops trigger. Verified against real data in production DB: found real BPJS/SIO/SIA documents within threshold and sent real Telegram notifications. Assumes a single pm2 instance (fork mode) and that the process fires daily without gaps (no separate "already notified" bookkeeping — see code comment). |
| FR-011 | Overstay alert >15 min | ✅ | |
| FR-012 | Monthly analytics (visits, peak hours, zone util, vendor perf), CSV export | ❌ | Dashboard has registration counts + 7-day trend + zone occupancy only. No peak-hour-of-day breakdown, no vendor/company performance metrics, no CSV export anywhere in the codebase |
| FR-013 | 3 roles: Security Operator, HSE/HR Admin, System Administrator | ✅ | Implemented as 4 distinct roles: `SECURITY_OPERATOR`, `HSE_ADMIN`, `HR_ADMIN` (kept separate rather than merged, since the two already had different dashboards), and the previously-missing `SYSTEM_ADMIN` — full staff CRUD (create/list/edit role/deactivate/reset password) at `/staff/admin/users`. Note: no in-app bootstrap for the very first System Administrator account — one must be seeded directly in the database (same as any other role currently), since a fresh system has no admin to create one from. |
| FR-014 | Manual override w/ justification, blacklist excluded | ✅ | `checkin/confirm` route — override only reachable for expired-doc rejections, never for blacklist (which hard-stops earlier in `checkin/validate`) |

## Non-Functional Requirements

| ID | Description | Status | Notes |
|---|---|---|---|
| NFR-001 | Pages load <3s | Not measured | No load-time testing performed |
| NFR-002 | Face recognition <5s | N/A | Feature not implemented (FR-004) |
| NFR-003 | 50 concurrent users | Not measured | No load testing performed |
| NFR-004 | bcrypt cost factor 12+ | ✅ | All staff account creation/password-reset paths (`/api/staff/admin/users`, `/api/staff/admin/users/[id]`) hash with cost 12. Verified end-to-end against the real database. |
| NFR-005 | TLS 1.2+ in transit | Assumed | Hosted on a self-managed VPS (SSH + pm2, not Vercel) — TLS termination depends on that server's own reverse-proxy/certificate config, not something this codebase controls or verifies |
| NFR-006 | Server-side RBAC enforcement | ✅ | Every staff API route checks `session.role` server-side via JWT; no client-only gating |
| NFR-007 | Audit log append-only, no deletion by anyone | ✅ | DB-level trigger (not just application logic) rejects UPDATE/DELETE/TRUNCATE on `AuditLog` unconditionally — verified by directly attempting each and confirming rejection |
| NFR-008 | 95% uptime during operating hours | Not measured | Depends on hosting/infra, not something the codebase itself enforces |
| NFR-009 | New operator completes check-in <3 min | Not measured | No usability testing performed |
| NFR-010 | Responsive down to 1280×720, no horizontal scroll | Not measured | No systematic viewport testing performed |
| NFR-011 | Override UI hidden for blacklist rejections | ✅ | `checkin-console.tsx` — blacklist block returns before any override UI is offered |

## What changed in this round (2026-07-25)

- Added `SYSTEM_ADMIN` role + full staff account CRUD UI/API (FR-013, NFR-004)
- Added scheduled Telegram document-expiry reminders at 30/14/7 days (FR-010, BR-005)
- Added SHA-256 hash-chained, DB-enforced append-only audit trail, wired into
  all major state-changing actions, with a live integrity-verification viewer
  (FR-006, BR-003, NFR-007)
- Confirmed as an explicit team decision (not an oversight): face recognition
  (FR-002A/FR-004) is out of scope for this build; QR-only check-in is used
  instead
- Fixed `deploy.sh`: `git pull origin "$REF" || true` silently swallowed pull
  failures, letting the deploy proceed on a stale checkout while `prisma db
  push` ran against an already-migrated database — Prisma read that as
  "these objects should be removed." Replaced with `git fetch` + `git reset
  --hard origin/$REF` so the server checkout can't drift.
- Discovered the FR-010 cron was originally wired for Vercel Cron
  (`vercel.json`), but this project actually deploys to a self-managed VPS
  via SSH + pm2 — Vercel Cron never fires there. Removed `vercel.json` and
  moved scheduling in-process via `node-cron` + Next.js `instrumentation.ts`,
  which runs on server boot under pm2.

## Still open

- FR-009A: fallback snapshot isn't truly independent of the main DB
- FR-012: no peak-hour/vendor-performance analytics, no CSV export
- FR-008: no photo thumbnail on the live inside/roster dashboards
- NFR-001/002/003/005/008/009/010: no measured verification (would need actual load/usability testing, not just code review)
