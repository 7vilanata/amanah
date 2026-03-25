import Link from "next/link";
import { addDays, addMonths, endOfMonth, format, startOfDay, subMonths } from "date-fns";
import { CalendarClock, ListChecks } from "lucide-react";
import { notFound } from "next/navigation";

import { ProjectBoard } from "@/components/projects/project-board";
import { ProjectCalendar } from "@/components/projects/project-calendar";
import { ProjectTaskListTable } from "@/components/projects/project-task-list-table";
import { TaskCreationSection } from "@/components/projects/task-creation-section";
import { ProjectMembersManager } from "@/components/projects/project-members-manager";
import { ProjectForm } from "@/components/projects/project-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { db } from "@/lib/db";
import { projectStatusLabels, projectStatusTone } from "@/lib/domain";
import { normalizeTaskFilters } from "@/lib/filters";
import { isAdminRole } from "@/lib/permissions";
import { filterOperationalTasks } from "@/lib/recurring-task-utils";
import { ensureRecurringTasksGenerated } from "@/lib/recurring-tasks";
import { requireProjectAccess } from "@/lib/session";
import { formatDateRange } from "@/lib/utils";

export const metadata = {
  title: "Project Detail",
};

export const dynamic = "force-dynamic";

type ProjectDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const tabItems = [
  { value: "overview", label: "Overview" },
  { value: "tasks", label: "Tasks" },
  { value: "board", label: "Board" },
  { value: "calendar", label: "Calendar" },
  { value: "members", label: "Members" },
] as const;

export default async function ProjectDetailPage({ params, searchParams }: ProjectDetailPageProps) {
  const { id } = await params;
  const filters = normalizeTaskFilters(await searchParams);
  const activeTab = filters.tab;
  const currentMonth = filters.month ? new Date(`${filters.month}-01T00:00:00`) : new Date();
  const user = await requireProjectAccess(id);
  const canManageProject = isAdminRole(user.role);

  await ensureRecurringTasksGenerated({
    projectIds: [id],
    fromDate: startOfDay(new Date()),
    toDate: activeTab === "calendar" ? endOfMonth(currentMonth) : addDays(startOfDay(new Date()), 7),
  });

  const project = await db.project.findFirst({
    where: {
      id,
      ...(canManageProject
        ? {}
        : {
            members: {
              some: {
                userId: user.id,
              },
            },
          }),
    },
    include: {
      createdBy: {
        select: {
          name: true,
        },
      },
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      },
      tasks: {
        include: {
          assignee: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
      },
      recurringTasks: {
        include: {
          defaultAssignee: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: [{ createdAt: "desc" }],
      },
    },
  });

  if (!project) {
    notFound();
  }

  const projectMembers = project.members.map((member) => member.user);
  const operationalTasks = filterOperationalTasks(project.tasks, new Date(), 7);
  const manualTasks = project.tasks.filter((task) => task.sourceType !== "RECURRING");
  const baseParams = new URLSearchParams();

  if (filters.month) baseParams.set("month", filters.month);

  const prevMonth = format(subMonths(currentMonth, 1), "yyyy-MM");
  const nextMonth = format(addMonths(currentMonth, 1), "yyyy-MM");
  const previousCalendarParams = new URLSearchParams(baseParams);
  const nextCalendarParams = new URLSearchParams(baseParams);
  previousCalendarParams.set("tab", "calendar");
  previousCalendarParams.set("month", prevMonth);
  nextCalendarParams.set("tab", "calendar");
  nextCalendarParams.set("month", nextMonth);

  const allUsers = canManageProject
    ? await db.user.findMany({
        where: {
          isActive: true,
        },
        orderBy: [{ role: "asc" }, { name: "asc" }],
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      })
    : [];

  const taskCount = operationalTasks.length;
  const doneCount = operationalTasks.filter((task) => task.status === "DONE").length;
  const overdueCount = operationalTasks.filter((task) => task.status !== "DONE" && task.dueDate < new Date()).length;

  function buildTabHref(tab: (typeof tabItems)[number]["value"]) {
    const params = new URLSearchParams(baseParams);
    params.set("tab", tab);
    return `/projects/${id}?${params.toString()}`;
  }

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-3">
            <Link href="/projects" className="text-sm font-semibold text-[var(--accent-strong)]">
              Kembali ke daftar project
            </Link>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-3xl font-semibold text-[var(--foreground)] md:text-4xl">{project.name}</h1>
              <Badge tone={projectStatusTone[project.status]}>{projectStatusLabels[project.status]}</Badge>
              {project.isArchived ? <Badge tone="danger">Arsip</Badge> : null}
            </div>
            <p className="max-w-3xl text-sm leading-7 text-[var(--muted)]">
              {project.clientName} • {formatDateRange(project.startDate, project.dueDate)} • dibuat oleh{" "}
              {project.createdBy.name}
            </p>
          </div>

          <div className="grid gap-3 text-sm text-[var(--muted-strong)] sm:grid-cols-3">
            <div className="rounded-2xl bg-[var(--surface)] px-4 py-3">
              <div className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">Task aktif</div>
              <div className="mt-2 text-2xl font-semibold text-[var(--foreground)]">{taskCount}</div>
            </div>
            <div className="rounded-2xl bg-[var(--surface)] px-4 py-3">
              <div className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">Done</div>
              <div className="mt-2 text-2xl font-semibold text-[var(--foreground)]">{doneCount}</div>
            </div>
            <div className="rounded-2xl bg-[var(--surface)] px-4 py-3">
              <div className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">Overdue</div>
              <div className="mt-2 text-2xl font-semibold text-[var(--foreground)]">{overdueCount}</div>
            </div>
          </div>
        </div>

        {project.isArchived ? (
          <div className="rounded-[18px] border border-[#ebc4bf] bg-[#fff1ef] px-4 py-4 text-sm leading-6 text-[#a53a2f]">
            Project ini berada dalam arsip. Detail tetap bisa dilihat, tetapi penambahan task dan perubahan member
            sebaiknya dilakukan setelah project diaktifkan kembali dari halaman daftar project.
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2 rounded-[20px] border border-[var(--border)] bg-[var(--surface)] p-2">
          {tabItems.map((tab) => (
            <Link
              key={tab.value}
              href={buildTabHref(tab.value)}
              className={`inline-flex min-w-[112px] items-center justify-center rounded-[14px] px-4 py-3 text-sm font-semibold transition ${
                activeTab === tab.value
                  ? "!border !border-[color:color-mix(in_srgb,var(--accent)_28%,white)] !bg-white !text-[var(--accent-strong)] shadow-[0_12px_24px_-18px_rgba(217,115,68,0.28)]"
                  : "text-[var(--muted-strong)] hover:bg-white"
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </div>
      </section>

      {activeTab === "overview" ? (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <Card>
            <CardHeader>
              <CardTitle>Ringkasan project</CardTitle>
              <CardDescription>Informasi inti yang akan dilihat tim saat membuka project.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-[24px] bg-[var(--surface)] p-5">
                <p className="text-sm leading-7 text-[var(--muted-strong)]">
                  {project.description || "Belum ada deskripsi project. Tambahkan objective dan deliverables utama."}
                </p>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl bg-[var(--surface)] p-4">
                  <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
                    <CalendarClock className="h-4 w-4" />
                    Timeline
                  </div>
                  <p className="text-sm text-[var(--muted-strong)]">{formatDateRange(project.startDate, project.dueDate)}</p>
                </div>
                <div className="rounded-2xl bg-[var(--surface)] p-4">
                  <div className="mb-2 text-xs uppercase tracking-[0.14em] text-[var(--muted)]">Member</div>
                  <p className="text-2xl font-semibold text-[var(--foreground)]">{projectMembers.length}</p>
                </div>
                <div className="rounded-2xl bg-[var(--surface)] p-4">
                  <div className="mb-2 text-xs uppercase tracking-[0.14em] text-[var(--muted)]">Client</div>
                  <p className="text-sm font-semibold text-[var(--foreground)]">{project.clientName}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Update metadata project</CardTitle>
              <CardDescription>
                {canManageProject
                  ? "Perbarui nama, client, status, dan timeline project."
                  : "Hanya owner dan admin yang dapat memperbarui metadata project."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {canManageProject && !project.isArchived ? (
                <ProjectForm
                  mode="edit"
                  projectId={project.id}
                  initialValues={{
                    name: project.name,
                    clientName: project.clientName,
                    description: project.description,
                    status: project.status,
                    startDate: project.startDate,
                    dueDate: project.dueDate,
                  }}
                />
              ) : (
                <div className="rounded-[24px] bg-[var(--surface)] px-4 py-6 text-sm leading-6 text-[var(--muted)]">
                  Project arsip atau role member akan melihat halaman ini dalam mode baca saja.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : null}

      {activeTab === "tasks" ? (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <ListChecks className="h-5 w-5 text-[var(--accent)]" />
            <h2 className="text-xl font-semibold text-[var(--foreground)]">Daftar task</h2>
          </div>

          {!project.isArchived ? (
            <TaskCreationSection
              projectId={project.id}
              members={projectMembers.map((member) => ({ id: member.id, name: member.name }))}
              showRecurringAction={canManageProject}
            />
          ) : (
            <div className="rounded-[22px] border border-[var(--border)] bg-[var(--surface)] px-5 py-5 text-sm leading-6 text-[var(--muted)]">
              Project arsip hanya dapat dilihat. Aktifkan kembali project bila ingin menambahkan task baru.
            </div>
          )}

          <section className="space-y-4">
            {manualTasks.length || project.recurringTasks.length ? (
              <ProjectTaskListTable
                projectId={project.id}
                tasks={manualTasks.map((task) => ({
                  id: task.id,
                  title: task.title,
                  description: task.description,
                  status: task.status,
                  priority: task.priority,
                  startDate: task.startDate,
                  dueDate: task.dueDate,
                  assigneeId: task.assigneeId,
                  assigneeName: task.assignee?.name ?? null,
                }))}
                recurringTasks={project.recurringTasks.map((task) => ({
                  id: task.id,
                  title: task.title,
                  description: task.description,
                  priority: task.priority,
                  frequency: task.frequency,
                  interval: task.interval,
                  startDate: task.startDate,
                  endDate: task.endDate,
                  isActive: task.isActive,
                  defaultAssigneeId: task.defaultAssigneeId,
                  defaultAssigneeName: task.defaultAssignee?.name ?? null,
                }))}
                members={projectMembers.map((member) => ({ id: member.id, name: member.name }))}
                canEditTasks={!project.isArchived}
                canManageTaskFields={canManageProject && !project.isArchived}
                canManageRecurringTemplates={canManageProject && !project.isArchived}
              />
            ) : (
              <EmptyState
                title="Belum ada task"
                description="Tambahkan task manual atau template task harian untuk mulai menyusun workload project ini."
              />
            )}
          </section>
        </div>
      ) : null}

      {activeTab === "board" ? (
        operationalTasks.length ? (
          !project.isArchived ? (
            <ProjectBoard
              tasks={operationalTasks.map((task) => ({
                id: task.id,
                title: task.title,
                status: task.status,
                priority: task.priority,
                dueDate: task.dueDate.toISOString(),
                assigneeName: task.assignee?.name ?? null,
              }))}
            />
          ) : (
            <EmptyState
              title="Project diarsipkan"
              description="Board hanya bisa diubah saat project aktif. Aktifkan kembali project untuk drag-and-drop status."
            />
          )
        ) : (
          <EmptyState
            title="Board kosong"
            description="Belum ada task aktif di jendela operasional project ini untuk ditampilkan di board."
          />
        )
      ) : null}

      {activeTab === "calendar" ? (
        project.tasks.length ? (
          <ProjectCalendar
            tasks={project.tasks.map((task) => ({
              id: task.id,
              title: task.title,
              description: task.description,
              startDate: task.startDate,
              dueDate: task.dueDate,
              status: task.status,
              priority: task.priority,
              assigneeId: task.assigneeId,
              assigneeName: task.assignee?.name ?? null,
              projectId: project.id,
              members: projectMembers.map((member) => ({
                id: member.id,
                name: member.name,
              })),
            }))}
            currentMonth={currentMonth}
            previousHref={`/projects/${project.id}?${previousCalendarParams.toString()}`}
            nextHref={`/projects/${project.id}?${nextCalendarParams.toString()}`}
            editableScope={!project.isArchived ? (canManageProject ? "all" : "member") : null}
          />
        ) : (
          <EmptyState
            title="Calendar kosong"
            description="Belum ada task di project ini untuk ditampilkan di calendar."
          />
        )
      ) : null}

      {activeTab === "members" ? (
        canManageProject ? (
          <ProjectMembersManager
            projectId={project.id}
            canManage={!project.isArchived}
            members={projectMembers}
            users={allUsers}
          />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Member project</CardTitle>
              <CardDescription>Daftar anggota yang terlibat di project ini.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {projectMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-4"
                >
                  <div>
                    <p className="font-medium text-[var(--foreground)]">{member.name}</p>
                    <p className="text-sm text-[var(--muted)]">{member.email}</p>
                  </div>
                  <Badge>{member.role}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        )
      ) : null}

      {activeTab === "overview" ? null : activeTab === "tasks" ? null : activeTab === "board" ? null : activeTab === "calendar" ? null : activeTab === "members" ? null : (
        <EmptyState title="Tab tidak ditemukan" description="Pilih salah satu tab yang tersedia untuk melihat detail project." />
      )}
    </div>
  );
}
