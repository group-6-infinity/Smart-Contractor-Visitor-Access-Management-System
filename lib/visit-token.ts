import prisma from "@/lib/prisma";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomToken(): string {
  const seg = () =>
    Array.from(
      { length: 4 },
      () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]
    ).join("");
  return `${seg()}-${seg()}-${seg()}`; // e.g. BHXV-NTA2-S7YW
}

export async function generateVisitToken(): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const token = randomToken();
    const existing = await prisma.visit.findUnique({
      where: { visitToken: token },
      select: { id: true },
    });
    if (!existing) return token;
  }
  // fallback super rare — tambah segmen
  return `${randomToken()}-${Date.now().toString(36).toUpperCase()}`;
}
