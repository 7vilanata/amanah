import Link from "next/link";
import { addDays } from "date-fns";
import { ArrowUpRight, BriefcaseBusiness, Clock3, TimerReset } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getBusinessToday, toBusinessDay } from "@/lib/business-time";
import { db } from "@/lib/db";
import { projectStatusLabels, taskStatusLabels, taskStatusTone } from "@/lib/domain";
import { isAdminRole, projectScopeForUser } from "@/lib/permissions";
import { filterOperationalTasks } from "@/lib/recurring-task-utils";
import { ensureRecurringTasksGenerated } from "@/lib/recurring-tasks";
import { requireSessionUser } from "@/lib/session";
import { formatDate, formatDateRange } from "@/lib/utils";

export const metadata = {
  title: "Dashboard",
};

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireSessionUser();
  const today = getBusinessToday();
  const nextWeek = addDays(today, 7);

  const visibleProjectWhere = {
    ...projectScopeForUser(user),
    isArchived: false,
  };

  await ensureRecurringTasksGenerated({
    projectWhere: visibleProjectWhere,
    fromDate: today,
    toDate: nextWeek,
  });

  const visibleTaskProjectWhere = isAdminRole(user.role)
    ? {
        isArchived: false,
      }
    : {
        isArchived: false,
        members: {
          some: {
            userId: user.id,
          },
        },
      };

  const [activeProjects, allVisibleTasks, dashboardProjects, clientGroups] = await Promise.all([
    db.project.count({
      where: {
        ...visibleProjectWhere,
        status: "ACTIVE",
      },
    }),
    db.task.findMany({
      where: {
        project: visibleTaskProjectWhere,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
      },
      orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
    }),
    db.project.findMany({
      where: visibleProjectWhere,
      orderBy: [{ dueDate: "asc" }],
      take: 5,
    }),
    db.project.groupBy({
      by: ["clientName"],
      where: visibleProjectWhere,
      _count: {
        _all: true,
      },
      orderBy: [{ _count: { id: "desc" } }, { clientName: "asc" }],
      take: 8,
    }),
  ]);

  const operationalTasks = filterOperationalTasks(allVisibleTasks, today, 7);
  const overdueTasks = operationalTasks.filter((task) => task.status !== "DONE" && toBusinessDay(task.dueDate) < today).length;
  const dueSoonTasks = operationalTasks.filter(
    (task) => task.status !== "DONE" && toBusinessDay(task.dueDate) >= today && toBusinessDay(task.dueDate) <= nextWeek,
  ).length;
  const statusDistribution = Object.entries(
    operationalTasks.reduce<Record<string, number>>((accumulator, task) => {
      accumulator[task.status] = (accumulator[task.status] ?? 0) + 1;
      return accumulator;
    }, {}),
  ).map(([status, count]) => ({
    status: status as (typeof operationalTasks)[number]["status"],
    _count: count,
  }));
  const myTasks = operationalTasks.filter((task) => task.assigneeId === user.id).slice(0, 8);
  const clientSummary = clientGroups.map((item) => ({
    clientName: item.clientName,
    projectCount: item._count._all,
  }));

  const statCards = [
    {
      title: "Project aktif",
      value: activeProjects,
      icon: BriefcaseBusiness,
      description: "Project internal/client yang sedang berjalan.",
    },
    {
      title: "Task overdue",
      value: overdueTasks,
      icon: TimerReset,
      description: "Task yang lewat due date dan belum selesai.",
    },
    {
      title: "Due 7 hari",
      value: dueSoonTasks,
      icon: Clock3,
      description: "Task yang akan jatuh tempo dalam 7 hari.",
    },
  ];

  return (
    <div className="space-y-8">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-3">
          <div className="inline-flex rounded-full bg-[var(--surface)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-strong)]">
            Dashboard
          </div>
          <h1 className="text-3xl font-semibold text-[var(--foreground)] md:text-4xl">
            Ringkasan operasi project hari ini
          </h1>
        </div>
        <div className="text-sm text-[var(--muted)]">Terakhir dibuka {formatDate(new Date())}</div>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        {statCards.map((card) => {
          const Icon = card.icon;

          return (
            <Card key={card.title}>
              <CardContent className="flex items-center justify-between gap-4 p-6">
                <div>
                  <p className="text-sm text-[var(--muted)]">{card.title}</p>
                  <p className="mt-2 text-4xl font-semibold text-[var(--foreground)]">{card.value}</p>
                  <p className="mt-2 max-w-xs text-sm leading-6 text-[var(--muted)]">{card.description}</p>
                </div>
                <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-[var(--surface)] text-[var(--accent)]">
                  <Icon className="h-7 w-7" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Distribusi status task</CardTitle>
            <CardDescription>Semua task pada project yang dapat Anda akses.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {statusDistribution.length ? (
              statusDistribution.map((item) => (
                <div
                  key={item.status}
                  className="flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-4"
                >
                  <div className="flex items-center gap-3">
                    <Badge tone={taskStatusTone[item.status]}>{taskStatusLabels[item.status]}</Badge>
                    <span className="text-sm text-[var(--muted-strong)]">Total task</span>
                  </div>
                  <span className="text-2xl font-semibold text-[var(--foreground)]">{item._count}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-[var(--muted)]">Belum ada task untuk ditampilkan.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div>
              <CardTitle>My Tasks</CardTitle>
              <CardDescription>Daftar task yang saat ini ditugaskan ke Anda.</CardDescription>
            </div>
            <Link href="/projects" className="text-sm font-semibold text-[var(--accent-strong)]">
              Lihat semua project
            </Link>
          </CardHeader>
          <CardContent className="space-y-4">
            {myTasks.length ? (
              myTasks.map((task) => (
                <Link
                  key={task.id}
                  href={`/projects/${task.project.id}?tab=tasks`}
                  className="flex flex-wrap items-start justify-between gap-4 rounded-[24px] border border-[var(--border)] bg-[var(--surface)] px-4 py-4 transition hover:border-[var(--accent-soft)]"
                >
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-[var(--foreground)]">{task.title}</h3>
                      <Badge tone={taskStatusTone[task.status]}>{taskStatusLabels[task.status]}</Badge>
                    </div>
                    <p className="text-sm text-[var(--muted)]">{task.project.name}</p>
                    <p className="text-sm text-[var(--muted)]">{formatDateRange(task.startDate, task.dueDate)}</p>
                  </div>
                  <div className="inline-flex items-center gap-2 text-sm font-medium text-[var(--accent-strong)]">
                    Buka
                    <ArrowUpRight className="h-4 w-4" />
                  </div>
                </Link>
              ))
            ) : (
              <div className="rounded-[24px] border border-dashed border-[var(--border)] bg-[var(--surface)] px-4 py-8 text-center text-sm text-[var(--muted)]">
                Belum ada task yang ditugaskan ke Anda.
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Project status</CardTitle>
            <CardDescription>Snapshot status project yang sedang Anda pegang.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {dashboardProjects.map((project) => (
              <Link
                href={`/projects/${project.id}`}
                key={project.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-4"
              >
                <div>
                  <p className="font-medium text-[var(--foreground)]">{project.name}</p>
                  <p className="text-sm text-[var(--muted)]">{project.clientName}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge>{projectStatusLabels[project.status]}</Badge>
                  <span className="text-sm text-[var(--muted)]">{formatDate(project.dueDate)}</span>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Client overview</CardTitle>
            <CardDescription>Daftar client dan jumlah project yang sedang bisa Anda akses.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {clientSummary.length ? (
              clientSummary.map((client) => (
                <div
                  key={client.clientName}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-4"
                >
                  <div>
                    <p className="font-medium text-[var(--foreground)]">{client.clientName}</p>
                    <p className="text-sm text-[var(--muted)]">
                      {client.projectCount} project{client.projectCount > 1 ? "" : ""}
                    </p>
                  </div>
                  <div className="text-2xl font-semibold text-[var(--foreground)]">{client.projectCount}</div>
                </div>
              ))
            ) : (
              <div className="rounded-[24px] border border-dashed border-[var(--border)] bg-[var(--surface)] px-4 py-8 text-center text-sm text-[var(--muted)]">
                Belum ada client yang muncul dari project aktif Anda.
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
