// Runs once when the Next.js server process boots (Node.js runtime only —
// this project is hosted on a self-managed VPS via pm2, not Vercel, so
// there is no platform-level cron. Scheduling has to live inside the
// long-running server process itself instead.
//
// Assumes a single pm2 instance (fork mode, not cluster) — if this app is
// ever run with multiple pm2 instances, this would register the job once
// per instance and send duplicate Telegram notifications. There is no
// ecosystem.config.js in this repo pinning instance count, so if that
// changes, this scheduling should move to a single dedicated worker
// process (or an external system cron hitting /api/cron/document-expiry)
// instead.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const cron = await import("node-cron");
  const { runDocumentExpiryCheck } = await import(
    "./lib/document-expiry-check"
  );

  // FR-010: daily at 08:00 WIB
  cron.schedule(
    "0 8 * * *",
    async () => {
      try {
        const result = await runDocumentExpiryCheck();
        console.log("[CRON] document-expiry check:", result);
      } catch (err) {
        console.error("[CRON] document-expiry check failed:", err);
      }
    },
    { timezone: "Asia/Jakarta" },
  );

  console.log("[CRON] document-expiry job scheduled (daily 08:00 WIB)");
}
