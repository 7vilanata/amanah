"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";

import { updateUserAction } from "@/actions/team-actions";
import { FormMessage } from "@/components/forms/form-message";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { roleLabels, roles } from "@/lib/domain";
import { formatDate } from "@/lib/utils";

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: "OWNER" | "ADMIN" | "MEMBER";
  isActive: boolean;
  createdAt: Date;
  projectCount: number;
  assignedTaskCount: number;
};

type UserManagementTableProps = {
  users: UserRow[];
};

function UserRowEditor({ user }: { user: UserRow }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    formData.set("userId", user.id);

    startTransition(async () => {
      setPending(true);
      const result = await updateUserAction(formData);
      setPending(false);
      setMessage(result.message);
      setSuccess(result.success);

      if (result.success) {
        router.refresh();
      }
    });
  }

  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-semibold text-[var(--foreground)]">{user.name}</h3>
              <Badge>{roleLabels[user.role]}</Badge>
              <Badge tone={user.isActive ? "success" : "danger"}>{user.isActive ? "Aktif" : "Nonaktif"}</Badge>
            </div>
            <p className="mt-1 text-sm text-[var(--muted)]">{user.email}</p>
          </div>
          <div className="text-sm text-[var(--muted)]">
            Dibuat {formatDate(user.createdAt)}
          </div>
        </div>

        <div className="grid gap-3 text-sm text-[var(--muted-strong)] md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl bg-[var(--surface)] p-4">
            <div className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">Role saat ini</div>
            <p className="mt-2 font-semibold text-[var(--foreground)]">{roleLabels[user.role]}</p>
          </div>
          <div className="rounded-2xl bg-[var(--surface)] p-4">
            <div className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">Project</div>
            <p className="mt-2 font-semibold text-[var(--foreground)]">{user.projectCount}</p>
          </div>
          <div className="rounded-2xl bg-[var(--surface)] p-4">
            <div className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">Task ditugaskan</div>
            <p className="mt-2 font-semibold text-[var(--foreground)]">{user.assignedTaskCount}</p>
          </div>
          <div className="rounded-2xl bg-[var(--surface)] p-4">
            <div className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">Status</div>
            <p className="mt-2 font-semibold text-[var(--foreground)]">{user.isActive ? "Aktif" : "Nonaktif"}</p>
          </div>
        </div>

        <form className="grid gap-4 border-t border-[var(--border)] pt-4 md:grid-cols-[1fr_1fr_auto]" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--muted-strong)]">Role baru</label>
            <Select name="role" defaultValue={user.role}>
              {roles.map((role) => (
                <option key={role} value={role}>
                  {roleLabels[role]}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--muted-strong)]">Status akun</label>
            <Select name="isActive" defaultValue={String(user.isActive)}>
              <option value="true">Aktif</option>
              <option value="false">Nonaktif</option>
            </Select>
          </div>
          <div className="flex items-end">
            <Button type="submit" disabled={pending}>
              {pending ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </form>

        <FormMessage success={success} message={message} />
      </CardContent>
    </Card>
  );
}

export function UserManagementTable({ users }: UserManagementTableProps) {
  return (
    <div className="space-y-4">
      {users.map((user) => (
        <UserRowEditor key={user.id} user={user} />
      ))}
    </div>
  );
}
