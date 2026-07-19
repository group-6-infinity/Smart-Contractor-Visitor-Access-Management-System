// lib/evacuation-snapshot.ts
// Fallback snapshot buat evacuation (FR-009A / AC #5).
// Simpan roster terakhir orang INSIDE, di-refresh berkala. Kalau generate
// real-time gagal (DB down dsb), pakai snapshot ini.
//
// Implementasi sederhana: simpan di tabel/row khusus atau di memori proses.
// Di sini pakai pendekatan DB — 1 row snapshot JSON yang di-overwrite.
//
// CATATAN: butuh tabel EvacuationSnapshot di schema:
//
// model EvacuationSnapshot {
//   id        String   @id @default("singleton")
//   data      Json     // array orang INSIDE
//   updatedAt DateTime @updatedAt
// }
//
// Kalau ga mau nambah tabel, bisa pakai file JSON di /tmp (tapi hilang tiap
// restart di serverless). Tabel lebih reliable.

import { Prisma } from "./generated/prisma/client";
import prisma from "./prisma";


export interface EvacuationPerson {
  fullName: string;
  company: string;
  type: string;
  zones: string[];
  checkInAt: string;
  isOverstay: boolean;
}

// ambil roster real-time orang yang lagi INSIDE
export async function getInsideRoster(
  zoneNames: Record<string, string>
): Promise<EvacuationPerson[]> {
  const events = await prisma.checkEvent.findMany({
    where: { status: "INSIDE" },
    orderBy: { checkInAt: "asc" },
    select: {
      checkInAt: true,
      zones: true,
      Registration: {
        select: { fullName: true, company: true, type: true },
      },
      Visit: { select: { windowEnd: true } },
    },
  });

  const now = Date.now();
  return events.map((e) => ({
    fullName: e.Registration.fullName,
    company: e.Registration.company,
    type: e.Registration.type,
    zones: e.zones.map((z) => zoneNames[z] ?? z),
    checkInAt: e.checkInAt.toISOString(),
    isOverstay: e.Visit?.windowEnd
      ? now > new Date(e.Visit.windowEnd).getTime()
      : false,
  }));
}

// simpan snapshot (dipanggil berkala / tiap check-in-out)
export async function saveSnapshot(people: EvacuationPerson[]) {
  await prisma.evacuationSnapshot.upsert({
    where: { id: "singleton" },
    create: {
      id: "singleton",
      data: people as unknown as Prisma.InputJsonValue,
    },
    update: {
      data: people as unknown as Prisma.InputJsonValue,
    },
  });
}

// baca snapshot terakhir (fallback)
export async function readSnapshot(): Promise<{
  people: EvacuationPerson[];
  updatedAt: Date | null;
}> {
  const snap = await prisma.evacuationSnapshot.findUnique({
    where: { id: "singleton" },
  });
  if (!snap) return { people: [], updatedAt: null };
  return {
    people: snap.data as unknown as EvacuationPerson[],
    updatedAt: snap.updatedAt,
  };
}
