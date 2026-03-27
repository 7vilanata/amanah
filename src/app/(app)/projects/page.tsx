import Link from "next/link";
import { addDays } from "date-fns";
import { FolderArchive, FolderKanban, Plus } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { ProjectCard } from "@/components/projects/project-card";
import { ProjectForm } from "@/components/projects/project-form";
import { Badge } from "@/components/ui/badge";
import { getBusinessToday } from "@/lib/business-time";
import { db } from "@/lib/db";
import { projectStatusLabels, projectStatusTone } from "@/lib/domain";
import { isAdminRole, projectScopeForUser } from "@/lib/permissions";
import { filterOperationalTasks } from "@/lib/recurring-task-utils";
import { ensureRecurringTasksGenerated } from "@/lib/recurring-tasks";
import { requireSessionUser } from "@/lib/session";
import { formatDateRange } from "@/lib/utils";

export const metadata = {
  title: "Projects",
};

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const user = await requireSessionUser();
  const visibleProjectWhere = projectScopeForUser(user);
  const today = getBusinessToday();

  await ensureRecurringTasksGenerated({
    projectWhere: {
      ...visibleProjectWhere,
      isArchived: false,
    },
    fromDate: today,
    toDate: addDays(today, 7),
  });

  const projects = await db.project.findMany({
    where: visibleProjectWhere,
    include: {
      members: {
        include: {
          user: {
            select: {
              name: true,
            },
          },
        },
      },
      _count: {
        select: {
          members: true,
        },
      },
      tasks: {
        select: {
          id: true,
          sourceType: true,
          occurrenceDate: true,
          status: true,
        },
      },
    },
    orderBy: [{ isArchived: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }],
  });

  const activeProjects = projects.filter((project) => !project.isArchived);
  const archivedProjects = projects.filter((project) => project.isArchived);
  const canManage = isAdminRole(user.role);
  const clientOptions = Array.from(new Set(projects.map((project) => project.clientName.trim()).filter(Boolean))).sort(
    (left, right) => left.localeCompare(right, "id"),
  );

  return (
    <div className="space-y-8">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-3">
          <div className="inline-flex rounded-full bg-[var(--surface)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-strong)]">
            Projects
          </div>
          <h1 className="text-3xl font-semibold text-[var(--foreground)] md:text-4xl">
            Daftar project agency dan histori arsip
          </h1>
        </div>
      </section>

      {canManage ? (
        <details className="group rounded-[22px] border border-[var(--border)] bg-white">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-5">
            <div>
              <h2 className="text-2xl font-semibold text-[var(--foreground)]">Buat project baru</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                Owner dan admin dapat langsung menambahkan project dari halaman ini.
              </p>
            </div>
            <span className="inline-flex h-11 items-center gap-2 rounded-xl bg-[var(--foreground)] px-4 text-sm font-semibold text-white">
              <Plus className="h-4 w-4" />
              Add project
            </span>
          </summary>
          <div className="border-t border-[var(--border)] p-5">
            <ProjectForm mode="create" clientOptions={clientOptions} />
          </div>
        </details>
      ) : null}

      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <FolderKanban className="h-5 w-5 text-[var(--accent)]" />
          <h2 className="text-xl font-semibold text-[var(--foreground)]">Project aktif</h2>
        </div>
        {activeProjects.length ? (
          <div className="overflow-hidden rounded-[22px] border border-[var(--border)] bg-white">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[var(--border)] text-left">
                <thead className="bg-[var(--surface)]">
                  <tr className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                    <th className="px-5 py-4">Project</th>
                    <th className="px-5 py-4">Client</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4">Timeline</th>
                    <th className="px-5 py-4">Task</th>
                    <th className="px-5 py-4">Member</th>
                    <th className="px-5 py-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {activeProjects.map((project) => (
                    <tr key={project.id} className="align-top">
                      <td className="px-5 py-4">
                        <div className="space-y-1">
                          <div className="text-base font-semibold text-[var(--foreground)]">{project.name}</div>
                          <p className="max-w-md text-sm leading-6 text-[var(--muted)]">
                            {project.description || "Belum ada deskripsi project."}
                          </p>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-[var(--muted-strong)]">{project.clientName}</td>
                      <td className="px-5 py-4">
                        <Badge tone={projectStatusTone[project.status]}>{projectStatusLabels[project.status]}</Badge>
                      </td>
                      <td className="px-5 py-4 text-sm leading-6 text-[var(--muted-strong)]">
                        {formatDateRange(project.startDate, project.dueDate)}
                      </td>
                      <td className="px-5 py-4 text-sm font-semibold text-[var(--foreground)]">
                        {filterOperationalTasks(project.tasks, today, 7).length}
                      </td>
                      <td className="px-5 py-4">
                        <div className="space-y-1">
                          <div className="text-sm font-semibold text-[var(--foreground)]">{project._count.members}</div>
                          {project.members.length ? (
                            <p className="max-w-[18rem] text-sm leading-6 text-[var(--muted)]">
                              {project.members
                                .map((member) => member.user.name)
                                .slice(0, 3)
                                .join(", ")}
                              {project.members.length > 3 ? "..." : ""}
                            </p>
                          ) : (
                            <p className="text-sm text-[var(--muted)]">Belum ada member</p>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Link
                          href={`/projects/${project.id}`}
                          className="inline-flex h-10 items-center justify-center rounded-xl border border-[var(--border)] px-4 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--accent)] hover:text-[var(--accent-strong)]"
                        >
                          Buka project
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <EmptyState
            title="Belum ada project aktif"
            description="Buat project baru untuk mulai mengatur workflow tim dan timeline agency."
          />
        )}
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <FolderArchive className="h-5 w-5 text-[var(--muted-strong)]" />
          <h2 className="text-xl font-semibold text-[var(--foreground)]">Arsip project</h2>
        </div>
        {archivedProjects.length ? (
          <div className="grid gap-4 xl:grid-cols-2">
            {archivedProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={{
                  id: project.id,
                  name: project.name,
                  clientName: project.clientName,
                  description: project.description,
                  status: project.status,
                  startDate: project.startDate,
                  dueDate: project.dueDate,
                  isArchived: project.isArchived,
                  memberNames: project.members.map((member) => member.user.name).slice(0, 4),
                  taskCount: filterOperationalTasks(project.tasks, today, 7).length,
                  memberCount: project._count.members,
                }}
                canManage={canManage}
                clientOptions={clientOptions}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title="Arsip masih kosong"
            description="Project yang selesai dan diarsipkan akan muncul di sini sebagai histori kerja agency."
          />
        )}
      </section>
    </div>
  );
}
