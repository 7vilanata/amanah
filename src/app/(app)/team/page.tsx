import { UserCog } from "lucide-react";

import { CreateUserForm } from "@/components/team/create-user-form";
import { UserManagementTable } from "@/components/team/user-management-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";
import { requireAdminSessionUser } from "@/lib/session";

export const metadata = {
  title: "Team",
};

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  await requireAdminSessionUser();

  const users = await db.user.findMany({
    include: {
      _count: {
        select: {
          memberships: true,
          assignedTasks: true,
        },
      },
    },
    orderBy: [{ role: "asc" }, { name: "asc" }],
  });

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <div className="inline-flex rounded-full bg-[var(--surface)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-strong)]">
          Team
        </div>
        <h1 className="text-3xl font-semibold text-[var(--foreground)] md:text-4xl">
          Buat akun tim dan atur role akses internal
        </h1>
      </section>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle>Tambah akun tim</CardTitle>
            <CardDescription>Akun yang dibuat di sini bisa langsung dipakai login ke aplikasi.</CardDescription>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-[20px] bg-[var(--surface)] text-[var(--accent)]">
            <UserCog className="h-6 w-6" />
          </div>
        </CardHeader>
        <CardContent>
          <CreateUserForm />
        </CardContent>
      </Card>

      <section className="space-y-4">
        <div className="grid gap-4 xl:grid-cols-3">
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-[var(--muted)]">Total user</p>
              <p className="mt-2 text-4xl font-semibold text-[var(--foreground)]">{users.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-[var(--muted)]">User aktif</p>
              <p className="mt-2 text-4xl font-semibold text-[var(--foreground)]">
                {users.filter((user) => user.isActive).length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-[var(--muted)]">Owner/Admin</p>
              <p className="mt-2 text-4xl font-semibold text-[var(--foreground)]">
                {users.filter((user) => user.role !== "MEMBER").length}
              </p>
            </CardContent>
          </Card>
        </div>

        <UserManagementTable
          users={users.map((user) => ({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            isActive: user.isActive,
            createdAt: user.createdAt,
            projectCount: user._count.memberships,
            assignedTaskCount: user._count.assignedTasks,
          }))}
        />
      </section>
    </div>
  );
}
