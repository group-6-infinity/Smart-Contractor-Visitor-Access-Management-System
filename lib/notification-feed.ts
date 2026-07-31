import prisma from "@/lib/prisma";
import { REGISTRATION_FEED_TYPE } from "@/lib/notification-types";

export interface FeedItem {
  id: string;
  type: string;
  title: string;
  message: string;
  createdAt: Date;
}

export interface PagedFeed {
  items: FeedItem[];
  total: number;
}

interface FeedRow {
  id: string;
  type: string;
  title: string;
  message: string;
  created_at_iso: string;
  total: string;
}

export async function getPagedFeed({
  type,
  q,
  page = 1,
  pageSize = 20,
}: {
  type?: string | null;
  q?: string | null;
  page?: number;
  pageSize?: number;
} = {}): Promise<PagedFeed> {
  const typeFilter = !type || type === "ALL" ? null : type;
  const like = q ? `%${q}%` : null;
  const offset = (Math.max(1, page) - 1) * pageSize;

  const rows = await prisma.$queryRaw<FeedRow[]>`
    WITH feed AS (
      SELECT
        id,
        "type"::text                       AS type,
        title,
        message,
        "createdAt"
      FROM "Notification"
      UNION ALL
      SELECT
        'reg-' || id,
        ${REGISTRATION_FEED_TYPE}::text    AS type,
        'New registration submitted',
        "fullName" || ' (' || company || ') submitted a '
          || lower("type"::text) || ' registration. Awaiting review.',
        "createdAt"
      FROM "Registration"
    )
    SELECT
      id,
      type,
      title,
      message,
      to_char("createdAt", 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS created_at_iso,
      (COUNT(*) OVER ())::text                              AS total
    FROM feed
    WHERE (${typeFilter}::text IS NULL OR type = ${typeFilter}::text)
      AND (
        ${like}::text IS NULL
        OR title   ILIKE ${like}::text
        OR message ILIKE ${like}::text
      )
    ORDER BY "createdAt" DESC
    LIMIT ${pageSize} OFFSET ${offset}
  `;

  return {
    items: rows.map((r) => ({
      id: r.id,
      type: r.type,
      title: r.title,
      message: r.message,
      createdAt: new Date(r.created_at_iso),
    })),
    total: rows.length ? Number(rows[0].total) : 0,
  };
}

export async function getBellFeed(limit = 20): Promise<FeedItem[]> {
  const { items } = await getPagedFeed({ page: 1, pageSize: limit });
  return items;
}
