"use client";

import { startTransition, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, UserX } from "lucide-react";

import { addProjectMemberAction, removeProjectMemberAction } from "@/actions/project-actions";
import { FormMessage } from "@/components/forms/form-message";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { roleLabels } from "@/lib/domain";

type ProjectMembersManagerProps = {
  projectId: string;
  canManage: boolean;
  members: Array<{ id: string; name: string; email: string; role: "OWNER" | "ADMIN" | "MEMBER" }>;
  users: Array<{ id: string; name: string; email: string; role: "OWNER" | "ADMIN" | "MEMBER" }>;
};

export function ProjectMembersManager({ projectId, canManage, members, users }: ProjectMembersManagerProps) {
  const router = useRouter();
  const availableUsers = useMemo(
    () => users.filter((user) => !members.some((member) => member.id === user.id)),
    [members, users],
  );
  const [selectedUserId, setSelectedUserId] = useState(availableUsers[0]?.id ?? "");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function handleAddMember(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData();
    formData.set("projectId", projectId);
    formData.set("userId", selectedUserId);

    startTransition(async () => {
      setPending(true);
      const result = await addProjectMemberAction(formData);
      setPending(false);
      setMessage(result.message);
      setSuccess(result.success);

      if (result.success) {
        router.refresh();
      }
    });
  }

  function handleRemoveMember(userId: string) {
    if (!window.confirm("Keluarkan member ini dari project? Task yang ditugaskan padanya akan di-unassign.")) {
      return;
    }

    startTransition(async () => {
      setPending(true);
      const result = await removeProjectMemberAction(projectId, userId);
      setPending(false);
      setMessage(result.message);
      setSuccess(result.success);

      if (result.success) {
        router.refresh();
      }
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(340px,0.8fr)]">
      <Card>
        <CardHeader>
          <CardTitle>Member project</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormMessage success={success} message={message} />
          <div className="space-y-3">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3"
              >
                <div>
                  <p className="font-medium text-[var(--foreground)]">{member.name}</p>
                  <p className="text-sm text-[var(--muted)]">{member.email}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge>{roleLabels[member.role]}</Badge>
                  {canManage ? (
                    <Button variant="ghost" size="sm" onClick={() => handleRemoveMember(member.id)} disabled={pending}>
                      <UserX className="h-4 w-4" />
                      Hapus
                    </Button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tambah member</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {canManage ? (
            availableUsers.length ? (
              <form className="space-y-4" onSubmit={handleAddMember}>
                <Select value={selectedUserId} onChange={(event) => setSelectedUserId(event.target.value)}>
                  {availableUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} - {roleLabels[user.role]}
                    </option>
                  ))}
                </Select>
                <Button type="submit" disabled={pending || !selectedUserId}>
                  <UserPlus className="h-4 w-4" />
                  {pending ? "Menambahkan..." : "Tambahkan ke project"}
                </Button>
              </form>
            ) : (
              <p className="text-sm leading-6 text-[var(--muted)]">
                Semua user aktif sudah tergabung di project ini.
              </p>
            )
          ) : (
            <p className="text-sm leading-6 text-[var(--muted)]">
              Hanya admin dan owner yang dapat mengatur member project.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
