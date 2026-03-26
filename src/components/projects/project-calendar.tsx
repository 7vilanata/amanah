"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  endOfMonth,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

import { TaskForm } from "@/components/projects/task-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getBusinessToday, toBusinessDay } from "@/lib/business-time";
import { taskStatusLabels, taskStatusTone } from "@/lib/domain";
import type { TaskPriority, TaskStatus } from "@/lib/domain";
import { cn } from "@/lib/utils";

type CalendarTask = {
  id: string;
  title: string;
  description: string | null;
  startDate: Date;
  dueDate: Date;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId: string | null;
  assigneeName: string | null;
  projectId: string;
  members: Array<{
    id: string;
    name: string;
  }>;
  projectName?: string;
};

type ProjectCalendarProps = {
  tasks: CalendarTask[];
  currentMonth: Date;
  previousHref: string;
  nextHref: string;
  title?: string;
  description?: string;
  editableScope?: "all" | "member" | null;
};

export function ProjectCalendar({
  tasks,
  currentMonth,
  previousHref,
  nextHref,
  title = "Calendar view",
  description,
  editableScope = null,
}: ProjectCalendarProps) {
  const [activeTask, setActiveTask] = useState<CalendarTask | null>(null);
  const portalTarget = typeof document === "undefined" ? null : document.body;
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });
  const businessToday = getBusinessToday();
  const isInteractive = Boolean(editableScope);
  const calendarDescription =
    description ?? `Menampilkan task yang overlap dengan tanggal di bulan ${format(currentMonth, "MMMM yyyy")}.`;

  useEffect(() => {
    if (!activeTask) {
      document.body.style.removeProperty("overflow");
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setActiveTask(null);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.removeProperty("overflow");
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeTask]);

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle>{title}</CardTitle>
            <p className="mt-1 text-sm text-[var(--muted)]">{calendarDescription}</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={previousHref}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)]"
            >
              <ChevronLeft className="h-4 w-4" />
            </Link>
            <Link
              href={nextHref}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)]"
            >
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
            {["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"].map((day) => (
              <div key={day} className="px-2 py-1">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-7">
            {days.map((day) => {
              const businessDay = toBusinessDay(day);
              const dayTasks = tasks.filter(
                (task) => businessDay >= toBusinessDay(task.startDate) && businessDay <= toBusinessDay(task.dueDate),
              );
              const isCurrentBusinessDay = businessDay.getTime() === businessToday.getTime();

              return (
                <div
                  key={businessDay.toISOString()}
                  className={cn(
                    "min-h-44 rounded-[18px] border border-[var(--border)] p-3",
                    isSameMonth(day, currentMonth) ? "bg-white" : "bg-[var(--surface)] opacity-70",
                    isCurrentBusinessDay ? "border-[var(--accent)]" : "",
                  )}
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-semibold text-[var(--foreground)]">{format(day, "d")}</span>
                    {isCurrentBusinessDay ? <Badge tone="accent">Hari ini</Badge> : null}
                  </div>
                  <div className="space-y-2">
                    {dayTasks.slice(0, 4).map((task) => (
                      <div
                        key={`${businessDay.toISOString()}-${task.id}`}
                        role={isInteractive ? "button" : undefined}
                        tabIndex={isInteractive ? 0 : undefined}
                        onClick={isInteractive ? () => setActiveTask(task) : undefined}
                        onKeyDown={
                          isInteractive
                            ? (event) => {
                                if (event.key === "Enter" || event.key === " ") {
                                  event.preventDefault();
                                  setActiveTask(task);
                                }
                              }
                            : undefined
                        }
                        className={cn(
                          "rounded-xl bg-[var(--surface)] px-3 py-2",
                          isInteractive
                            ? "cursor-pointer transition hover:bg-[var(--surface-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                            : "",
                        )}
                      >
                        <p className="overflow-hidden text-sm font-medium text-[var(--foreground)] [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:3]">
                          {task.title}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <Badge tone={taskStatusTone[task.status]}>{taskStatusLabels[task.status]}</Badge>
                        </div>
                      </div>
                    ))}
                    {dayTasks.length > 4 ? (
                      <p className="text-xs font-medium text-[var(--muted)]">+{dayTasks.length - 4} task lainnya</p>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {portalTarget && activeTask
        ? createPortal(
            <div
              className="fixed inset-0 z-[100] overflow-y-auto overscroll-y-contain bg-[rgba(17,17,17,0.45)] backdrop-blur-sm"
              onClick={() => setActiveTask(null)}
            >
              <div className="flex min-h-dvh items-start justify-center px-4 py-4 md:px-6 md:py-8">
                <div
                  className="flex max-h-[calc(100dvh-2rem)] w-full max-w-4xl flex-col rounded-[24px] border border-[var(--border)] bg-white shadow-[0_28px_80px_-36px_rgba(16,12,8,0.45)] md:max-h-[calc(100dvh-4rem)]"
                  onClick={(event) => event.stopPropagation()}
                >
                  <div className="flex items-start justify-between gap-4 border-b border-[var(--border)] px-6 py-5">
                    <div>
                      <div className="inline-flex rounded-full bg-[var(--surface)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-strong)]">
                        Edit Task
                      </div>
                      <h3 className="mt-3 text-2xl font-semibold text-[var(--foreground)]">{activeTask.title}</h3>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setActiveTask(null)}>
                      <X className="h-4 w-4" />
                      Tutup
                    </Button>
                  </div>

                  <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
                    <TaskForm
                      projectId={activeTask.projectId}
                      taskId={activeTask.id}
                      mode="edit"
                      members={activeTask.members}
                      initialValues={{
                        title: activeTask.title,
                        description: activeTask.description,
                        status: activeTask.status,
                        priority: activeTask.priority,
                        startDate: activeTask.startDate,
                        dueDate: activeTask.dueDate,
                        assigneeId: activeTask.assigneeId,
                      }}
                      editableScope={editableScope === "all" ? "all" : "member"}
                      submitLabel="Simpan perubahan"
                      showDeleteAction={editableScope === "all"}
                      onDeleteSuccess={() => setActiveTask(null)}
                      onSuccess={() => setActiveTask(null)}
                    />
                  </div>
                </div>
              </div>
            </div>,
            portalTarget,
          )
        : null}
    </>
  );
}
