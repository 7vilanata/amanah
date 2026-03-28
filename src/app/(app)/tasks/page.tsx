import Link from "next/link";
import { addDays } from "date-fns";
import { ListChecks } from "lucide-react";

import { GlobalTaskTable } from "@/components/tasks/global-task-table";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { getBusinessToday } from "@/lib/business-time";
import { db } from "@/lib/db";
import { isAdminRole, projectScopeForUser } from "@/lib/permissions";
import { filterOperationalTasks } from "@/lib/recurring-task-utils";
import { ensureRecurringTasksGenerated } from "@/lib/recurring-tasks";
import { requireSessionUser } from "@/lib/session";
import { matchesTaskRange, normalizeTaskRange, taskRangeItems, type TaskRange } from "@/lib/task-range";
import { summarizeTaskWorkLogs } from "@/lib/task-work-logs";
import { cn, queryValue } from "@/lib/utils";

export const metadata = {
  title: "Tasks",
};

export const dynamic = "force-dynamic";

type TasksPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function TasksPage({ searchParams }: TasksPageProps) {
  const user = await requireSessionUser();
  const canManageTaskFields = isAdminRole(user.role);
  const selectedRange = normalizeTaskRange(queryValue((await searchParams).range));
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

  const allVisibleTasks = await db.task.findMany({
    where: {
      project: visibleTaskProjectWhere,
    },
    include: {
      assignee: {
        select: {
          id: true,
          name: true,
        },
      },
      workLogs: {
        select: {
          userId: true,
          hours: true,
          note: true,
          workDate: true,
        },
      },
      project: {
        select: {
          id: true,
          name: true,
          members: {
            select: {
              user: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
  });

  const operationalTasks = filterOperationalTasks(allVisibleTasks, today, 7);
  const tasks = operationalTasks.filter((task) => matchesTaskRange(task, selectedRange, today));
  const mappedTasks = tasks.map((task) => {
    const workLogSummary = summarizeTaskWorkLogs(task.workLogs, user.id, today);

    return {
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      sourceType: task.sourceType,
      startDate: task.startDate,
      dueDate: task.dueDate,
      assigneeId: task.assigneeId,
      assigneeName: task.assignee?.name ?? null,
      totalLoggedHours: workLogSummary.totalHours,
      todayWorkHours: workLogSummary.todayHours,
      todayWorkNote: workLogSummary.todayNote,
      project: {
        id: task.project.id,
        name: task.project.name,
        members: task.project.members.map((member) => ({
          id: member.user.id,
          name: member.user.name,
        })),
      },
    };
  });
  const rangeCounts = taskRangeItems.reduce<Record<TaskRange, number>>(
    (accumulator, item) => {
      accumulator[item.value] = operationalTasks.filter((task) => matchesTaskRange(task, item.value, today)).length;
      return accumulator;
    },
    {
      today: 0,
      tomorrow: 0,
      week: 0,
      overdue: 0,
    },
  );
  const activeRangeLabel = taskRangeItems.find((item) => item.value === selectedRange)?.label ?? "Today";

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <div className="inline-flex rounded-full bg-[var(--surface)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-strong)]">
          Tasks
        </div>
        <h1 className="text-3xl font-semibold text-[var(--foreground)] md:text-4xl">Gabungan semua task</h1>
      </section>

      <Card>
        <CardContent className="space-y-5 p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <ListChecks className="h-5 w-5 text-[var(--accent)]" />
              <div>
                <h2 className="text-xl font-semibold text-[var(--foreground)]">Task list</h2>
                <p className="text-sm text-[var(--muted)]">
                  Menampilkan preset <span className="font-semibold text-[var(--muted-strong)]">{activeRangeLabel}</span>.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {taskRangeItems.map((item) => (
                <Link
                  key={item.value}
                  href={item.value === "today" ? "/tasks" : `/tasks?range=${item.value}`}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition",
                    selectedRange === item.value
                      ? "border-[color:color-mix(in_srgb,var(--accent)_28%,white)] bg-white text-[var(--accent-strong)] shadow-[0_12px_24px_-18px_rgba(217,115,68,0.28)]"
                      : "border-[var(--border)] bg-[var(--surface)] text-[var(--muted-strong)] hover:bg-white",
                  )}
                >
                  <span>{item.label}</span>
                  <span className="rounded-full bg-white/80 px-2 py-0.5 text-xs text-[var(--muted-strong)]">
                    {rangeCounts[item.value]}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          {tasks.length ? (
            <GlobalTaskTable
              canManageTaskFields={canManageTaskFields}
              tasks={mappedTasks}
            />
          ) : (
            <EmptyState
              title={`Belum ada task untuk ${activeRangeLabel.toLowerCase()}`}
              description="Coba ganti preset range di atas untuk melihat task pada rentang waktu yang berbeda."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
