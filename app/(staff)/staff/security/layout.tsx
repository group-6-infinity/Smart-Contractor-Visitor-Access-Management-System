import SecuritySidebar from "@/components/layouts/dashboards/security/security-sidebar";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
export default async function SecurityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("staff_token")?.value;

  let session: { name?: string; email: string; role: string } | null = null;
  if (token) {
    try {
      const secret = new TextEncoder().encode(process.env.STAFF_JWT_SECRET);
      const { payload } = await jwtVerify(token, secret);
      session = payload as { name?: string; email: string; role: string };
    } catch {
      session = null;
    }
  }

  if (!session) redirect("/internal/staff/login");
  if (session.role !== "SECURITY_OPERATOR") redirect("/staff/dashboard");

  return (
    <div className="flex">
      <SecuritySidebar staffName={session.name ?? session.email} />
      <main className="h-svh flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
