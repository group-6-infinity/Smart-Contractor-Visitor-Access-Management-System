import CheckinConsole from "@/components/layouts/dashboards/checkin-console";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

async function getRole() {
  const cookieStore = await cookies();
  const token = cookieStore.get("staff_token")?.value;
  if (!token) return null;
  try {
    const secret = new TextEncoder().encode(process.env.STAFF_JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return payload.role as string;
  } catch {
    return null;
  }
}

export default async function CheckinPage() {
  const role = await getRole();
  if (!role) redirect("/internal/staff/login");

  return <CheckinConsole />;
}
