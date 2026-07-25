import { NextRequest, NextResponse } from "next/server";
import { runDocumentExpiryCheck } from "@/lib/document-expiry-check";

// Manual/ops trigger for FR-010's document-expiry check. The automatic
// daily run is scheduled in-process (see instrumentation.ts) — this route
// exists so the check can be re-run on demand, e.g. for testing.
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (
    !process.env.CRON_SECRET ||
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const result = await runDocumentExpiryCheck();
  return NextResponse.json(result);
}
