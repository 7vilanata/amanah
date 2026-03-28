"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

import { TaskForm } from "@/components/projects/task-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { taskPriorityLabels, taskPriorityTone, taskStatusLabels, taskStatusTone } from "@/lib/domain";
import { formatDateRange } from "@/lib/utils";

type GlobalTaskTableTask = {
  id: string;
  title: string;
  description: string | null;
  status: "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  sourceType: "MANUAL" | "RECURRING";
  startDate: Date;
  dueDate: Date;
  assigneeId: string | null;
  assigneeName: string | null;
  project: {
    id: string;
    name: string;
    members: Array<{
      id: string;
      name: string;
    }>;
  };
  totalLoggedHours: number;
  todayWorkHours: number | null;
  todayWorkNote: string | null;
};

type GlobalTaskTableProps = {
  tasks: GlobalTaskTableTask[];
  canManageTaskFields: boolean;
};

export function GlobalTaskTable({ tasks, canManageTaskFields }: GlobalTaskTableProps) {
  const [activeTask, setActiveTask] = useState<GlobalTaskTableTask | null>(null);
  const portalTarget = typeof document === "undefined" ? null : document.body;

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
      <div className="overflow-hidden rounded-[22px] border border-[var(--border)] bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[var(--border)] text-left">
            <thead className="bg-[var(--surface)]">
              <tr className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                <th className="px-5 py-4">Task</th>
                <th className="px-5 py-4">Project</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Prioritas</th>
                <th className="px-5 py-4">Timeline</th>
                <th className="px-5 py-4">PIC</th>
                <th className="px-5 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {tasks.map((task) => (
                <tr key={task.id} className="align-top">
                  <td className="px-5 py-4">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="text-sm font-semibold text-[var(--foreground)]">{task.title}</div>
                        {task.sourceType === "RECURRING" ? <Badge tone="neutral">Harian</Badge> : null}
                      </div>
                      <p className="max-w-xl overflow-hidden text-sm leading-6 text-[var(--muted)] [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
                        {task.description || "Task belum punya deskripsi tambahan."}
                      </p>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <Link
                      href={`/projects/${task.project.id}?tab=tasks`}
                      className="text-sm font-semibold text-[var(--accent-strong)] transition hover:opacity-80"
                    >
                      {task.project.name}
                    </Link>
                  </td>
                  <td className="px-5 py-4">
                    <Badge tone={taskStatusTone[task.status]}>{taskStatusLabels[task.status]}</Badge>
                  </td>
                  <td className="px-5 py-4">
                    <Badge tone={taskPriorityTone[task.priority]}>{taskPriorityLabels[task.priority]}</Badge>
                  </td>
                  <td className="px-5 py-4 text-sm leading-6 text-[var(--muted-strong)]">
                    {formatDateRange(task.startDate, task.dueDate)}
                  </td>
                  <td className="px-5 py-4 text-sm text-[var(--muted-strong)]">
                    {task.assigneeName || "Belum ada PIC"}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Button variant="secondary" size="sm" onClick={() => setActiveTask(task)}>
                      Buka
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
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
                      projectId={activeTask.project.id}
                      taskId={activeTask.id}
                      mode="edit"
                      members={activeTask.project.members}
                      initialValues={{
                        title: activeTask.title,
                        description: activeTask.description,
                        status: activeTask.status,
                        priority: activeTask.priority,
                        startDate: activeTask.startDate,
                        dueDate: activeTask.dueDate,
                        assigneeId: activeTask.assigneeId,
                        workHours: activeTask.todayWorkHours,
                        workNote: activeTask.todayWorkNote,
                        totalLoggedHours: activeTask.totalLoggedHours,
                      }}
                      editableScope={canManageTaskFields ? "all" : "member"}
                      submitLabel="Simpan perubahan"
                      showDeleteAction={canManageTaskFields}
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
