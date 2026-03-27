"use client";

import Link from "next/link";
import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { Archive, CalendarRange, PencilLine, UsersRound } from "lucide-react";

import { toggleProjectArchiveAction } from "@/actions/project-actions";
import { FormMessage } from "@/components/forms/form-message";
import { ProjectForm } from "@/components/projects/project-form";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { projectStatusLabels, projectStatusTone } from "@/lib/domain";
import { cn, formatDateRange } from "@/lib/utils";

type ProjectCardProps = {
  project: {
    id: string;
    name: string;
    clientName: string;
    description: string | null;
    status: "PLANNING" | "ACTIVE" | "ON_HOLD" | "COMPLETED";
    startDate: Date;
    dueDate: Date;
    isArchived: boolean;
    memberNames: string[];
    taskCount: number;
    memberCount: number;
  };
  canManage: boolean;
  clientOptions?: string[];
};

export function ProjectCard({ project, canManage, clientOptions = [] }: ProjectCardProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function handleArchive() {
    if (!window.confirm(project.isArchived ? "Aktifkan kembali project ini?" : "Arsipkan project ini?")) {
      return;
    }

    const formData = new FormData();
    formData.set("projectId", project.id);
    formData.set("archived", String(!project.isArchived));

    startTransition(async () => {
      setPending(true);
      const result = await toggleProjectArchiveAction(formData);
      setPending(false);
      setMessage(result.message);
      setSuccess(result.success);

      if (result.success) {
        router.refresh();
      }
    });
  }

  return (
    <Card className="h-full">
      <CardHeader className="gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="text-xl">{project.name}</CardTitle>
              <Badge tone={projectStatusTone[project.status]}>{projectStatusLabels[project.status]}</Badge>
              {project.isArchived ? <Badge tone="neutral">Arsip</Badge> : null}
            </div>
            <CardDescription>{project.clientName}</CardDescription>
          </div>

          <Link href={`/projects/${project.id}`} className={cn(buttonVariants({ variant: "secondary" }))}>
            Buka project
          </Link>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        <p className="text-sm leading-6 text-[var(--muted)]">
          {project.description || "Belum ada deskripsi project. Tambahkan konteks agar tim memahami deliverable."}
        </p>

        <div className="grid gap-3 text-sm text-[var(--muted-strong)] md:grid-cols-3">
          <div className="rounded-2xl bg-[var(--surface)] p-4">
            <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
              <CalendarRange className="h-4 w-4" />
              Timeline
            </div>
            <p>{formatDateRange(project.startDate, project.dueDate)}</p>
          </div>
          <div className="rounded-2xl bg-[var(--surface)] p-4">
            <div className="mb-2 text-xs uppercase tracking-[0.14em] text-[var(--muted)]">Task aktif</div>
            <p className="text-lg font-semibold text-[var(--foreground)]">{project.taskCount}</p>
          </div>
          <div className="rounded-2xl bg-[var(--surface)] p-4">
            <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
              <UsersRound className="h-4 w-4" />
              Member
            </div>
            <p className="text-lg font-semibold text-[var(--foreground)]">{project.memberCount}</p>
          </div>
        </div>

        {project.memberNames.length ? (
          <div className="flex flex-wrap gap-2">
            {project.memberNames.map((memberName) => (
              <Badge key={`${project.id}-${memberName}`} tone="neutral">
                {memberName}
              </Badge>
            ))}
          </div>
        ) : null}

        <FormMessage success={success} message={message} />

        {canManage ? (
          <details className="group rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-[var(--foreground)]">
                <PencilLine className="h-4 w-4" />
                Edit project
              </div>
              <span className="text-xs text-[var(--muted)] group-open:hidden">Buka form</span>
              <span className="hidden text-xs text-[var(--muted)] group-open:inline">Tutup</span>
            </summary>
            <div className="mt-4 space-y-4 border-t border-[var(--border)] pt-4">
              <ProjectForm
                mode="edit"
                projectId={project.id}
                clientOptions={clientOptions}
                initialValues={{
                  name: project.name,
                  clientName: project.clientName,
                  description: project.description,
                  status: project.status,
                  startDate: project.startDate,
                  dueDate: project.dueDate,
                }}
              />
              <Button variant="danger" onClick={handleArchive} disabled={pending}>
                <Archive className="h-4 w-4" />
                {pending ? "Memproses..." : project.isArchived ? "Aktifkan kembali" : "Arsipkan project"}
              </Button>
            </div>
          </details>
        ) : null}
      </CardContent>
    </Card>
  );
}
