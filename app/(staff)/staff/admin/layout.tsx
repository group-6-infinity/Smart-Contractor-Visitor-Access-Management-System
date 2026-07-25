import AdminSidebar from "@/components/layouts/dashboards/admin/admin-sidebar";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function AdminLayout({
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
  if (session.role !== "SYSTEM_ADMIN") redirect("/staff/dashboard");

  return (
    <div className="flex">
      <AdminSidebar staffName={session.name ?? session.email} />
      <main className="h-svh flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
