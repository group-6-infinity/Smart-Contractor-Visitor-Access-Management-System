import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Role } from "@/lib/generated/prisma/enums";

const ROLE_REDIRECT: Record<Role, string> = {
  SECURITY_OPERATOR: "/staff/security/checkin",
  HSE_ADMIN: "/staff/overview",
  HR_ADMIN: "/staff/overview",
};
const STAFF_LOGIN_URL = "/internal/staff/login";

export default async function DashboardPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get("staff_token")?.value

  if (!token) redirect(STAFF_LOGIN_URL)

  let destination: string | null = null

  try {
    const secret = new TextEncoder().encode(process.env.STAFF_JWT_SECRET)
    const { payload } = await jwtVerify(token, secret)
    const role = payload.role as Role
    destination = ROLE_REDIRECT[role] ?? null
  } catch {
    redirect(STAFF_LOGIN_URL)
  }

  if (!destination) redirect(STAFF_LOGIN_URL)
  redirect(destination)
}
