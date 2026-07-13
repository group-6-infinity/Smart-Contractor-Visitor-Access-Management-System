import StaffLoginForm from "@/components/layouts/forms/staff-login-forms"
import { jwtVerify } from "jose"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export default async function StaffLoginPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get("staff_token")?.value

  let valid = false
  if (token) {
    try {
      const secret = new TextEncoder().encode(process.env.STAFF_JWT_SECRET)
      await jwtVerify(token, secret)
      valid = true
    } catch {
      valid = false
    }
  }

  if (valid) redirect("/staff/dashboard")

  return <StaffLoginForm />
}
