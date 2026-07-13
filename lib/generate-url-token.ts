import { customAlphabet } from "nanoid"
import prisma from "./prisma"

const createTrackingToken = customAlphabet(
  "ABCDEFGHJKLMNPQRSTUVWXYZ23456789",
  12,
)

function generateToken() {
  const raw = createTrackingToken()
  return `${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8, 12)}`
}

export async function generateUniqueToken(): Promise<string> {
  const token = generateToken()

  const existing = await prisma.registration.findUnique({
    where: { trackingToken: token },
    select: { id: true },
  })

  if (existing) return generateUniqueToken()
  return token
}
