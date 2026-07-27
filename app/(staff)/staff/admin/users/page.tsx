import prisma from "@/lib/prisma";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import StaffUsersTable from "@/components/layouts/dashboards/admin/staff-users-table";

export default async function StaffAccountsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("staff_token")?.value;
  const secret = new TextEncoder().encode(process.env.STAFF_JWT_SECRET);
  const { payload } = await jwtVerify(token!, secret);
  const currentUserId = payload.id as string;

  const users = await prisma.users.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Staff Accounts</h1>
        <p className="text-muted-foreground text-sm">
          Create and manage Security Operator, HSE Admin, HR Admin, and
          System Administrator accounts.
        </p>
      </div>
      <StaffUsersTable
        initialUsers={users.map((u) => ({
          ...u,
          createdAt: u.createdAt.toISOString(),
        }))}
        currentUserId={currentUserId}
      />
    </div>
  );
}
