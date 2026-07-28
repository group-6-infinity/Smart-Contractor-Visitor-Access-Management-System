"use server";

import { cookies } from "next/headers";

// Landing on the tracking search page is treated as "start over": every
// track_session_* cookie left behind by a previous /track-status/[token]
// verification gets dropped, so each registration has to be re-verified with
// the matching email instead of riding a session from an earlier visit.
export async function clearTrackSessions() {
  const cookieStore = await cookies();
  for (const cookie of cookieStore.getAll()) {
    if (cookie.name.startsWith("track_session_")) {
      cookieStore.delete({ name: cookie.name, path: "/" });
    }
  }
}
