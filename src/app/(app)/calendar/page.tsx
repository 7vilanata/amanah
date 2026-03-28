import { addMonths, endOfMonth, format, startOfMonth, subMonths } from "date-fns";
import { ProjectCalendar } from "@/components/projects/project-calendar";
import { EmptyState } from "@/components/ui/empty-state";
import { getBusinessToday, parseBusinessMonth } from "@/lib/business-time";
import { db } from "@/lib/db";
import { isAdminRole, projectScopeForUser } from "@/lib/permissions";
import { ensureRecurringTasksGenerated } from "@/lib/recurring-tasks";
import { requireSessionUser } from "@/lib/session";
import { summarizeTaskWorkLogs } from "@/lib/task-work-logs";

export const metadata = {
  title: "Global Calendar",
};

export const dynamic = "force-dynamic";

type CalendarPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CalendarPage({ searchParams }: CalendarPageProps) {
  const user = await requireSessionUser();
  const canManageTaskFields = isAdminRole(user.role);
  const today = getBusinessToday();
  const resolvedSearchParams = await searchParams;
  const monthParam = Array.isArray(resolvedSearchParams.month)
    ? resolvedSearchParams.month[0]
    : resolvedSearchParams.month;
  const currentMonth = monthParam ? parseBusinessMonth(monthParam) : today;

  const visibleProjectWhere = {
    ...projectScopeForUser(user),
    isArchived: false,
  };

  await ensureRecurringTasksGenerated({
    projectWhere: visibleProjectWhere,
    fromDate: today,
    toDate: endOfMonth(currentMonth),
  });

  const tasks = await db.task.findMany({
    where: {
      project: visibleProjectWhere,
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
          clientName: true,
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
    orderBy: [{ startDate: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }],
  });

  const previousParams = new URLSearchParams();
  const nextParams = new URLSearchParams();
  const mappedTasks = tasks.map((task) => {
    const workLogSummary = summarizeTaskWorkLogs(task.workLogs, user.id, today);

    return {
      id: task.id,
      title: task.title,
      description: task.description,
      startDate: task.startDate,
      dueDate: task.dueDate,
      status: task.status,
      priority: task.priority,
      assigneeId: task.assigneeId,
      assigneeName: task.assignee?.name ?? null,
      projectId: task.project.id,
      projectName: task.project.name,
      totalLoggedHours: workLogSummary.totalHours,
      todayWorkHours: workLogSummary.todayHours,
      todayWorkNote: workLogSummary.todayNote,
      members: task.project.members.map((member) => ({
        id: member.user.id,
        name: member.user.name,
      })),
    };
  });

  previousParams.set("month", format(subMonths(startOfMonth(currentMonth), 1), "yyyy-MM"));
  nextParams.set("month", format(addMonths(startOfMonth(currentMonth), 1), "yyyy-MM"));

  return (
    <div className="space-y-8">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-3">
          <div className="inline-flex rounded-full bg-[var(--surface)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-strong)]">
            Global Calendar
          </div>
          <h1 className="text-3xl font-semibold text-[var(--foreground)] md:text-4xl">
            Lihat timeline task dari semua project yang bisa Anda akses
          </h1>
        </div>
      </section>

      {tasks.length ? (
        <ProjectCalendar
          tasks={mappedTasks}
          currentMonth={currentMonth}
          previousHref={`/calendar?${previousParams.toString()}`}
          nextHref={`/calendar?${nextParams.toString()}`}
          title="Calendar lintas project"
          description={`Menampilkan task yang overlap dengan ${format(currentMonth, "MMMM yyyy")} dari semua project yang dapat Anda akses.`}
          editableScope={canManageTaskFields ? "all" : "member"}
        />
      ) : (
        <EmptyState
          title="Calendar belum punya task"
          description="Tambahkan task pada project aktif untuk mulai melihat timeline lintas project di sini."
        />
      )}
    </div>
  );
}
