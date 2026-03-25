"use client";

import { Fragment, startTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { PencilLine, Trash2 } from "lucide-react";

import { deleteTaskAction } from "@/actions/task-actions";
import { FormMessage } from "@/components/forms/form-message";
import { TaskForm } from "@/components/projects/task-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { taskPriorityLabels, taskPriorityTone, taskStatusLabels, taskStatusTone } from "@/lib/domain";
import { formatDateRange } from "@/lib/utils";

type TaskTableProps = {
  projectId: string;
  tasks: Array<{
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
  }>;
  members: Array<{ id: string; name: string }>;
  canManage: boolean;
};

type TaskTableRowProps = {
  projectId: string;
  task: TaskTableProps["tasks"][number];
  members: TaskTableProps["members"];
  canManage: boolean;
};

function TaskTableRow({ projectId, task, members, canManage }: TaskTableRowProps) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function handleDelete() {
    if (!window.confirm("Hapus task ini? Tindakan ini tidak dapat dibatalkan.")) {
      return;
    }

    startTransition(async () => {
      setPending(true);
      const result = await deleteTaskAction(task.id);
      setPending(false);
      setMessage(result.message);
      setSuccess(result.success);

      if (result.success) {
        router.refresh();
      }
    });
  }

  return (
    <Fragment>
      <tr className="align-top">
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
          <Badge tone={taskStatusTone[task.status]}>{taskStatusLabels[task.status]}</Badge>
        </td>
        <td className="px-5 py-4">
          <Badge tone={taskPriorityTone[task.priority]}>{taskPriorityLabels[task.priority]}</Badge>
        </td>
        <td className="px-5 py-4 text-sm leading-6 text-[var(--muted-strong)]">
          {formatDateRange(task.startDate, task.dueDate)}
        </td>
        <td className="px-5 py-4 text-sm text-[var(--muted-strong)]">{task.assigneeName || "Belum ada PIC"}</td>
        <td className="px-5 py-4 text-right">
          {canManage ? (
            <Button variant="secondary" size="sm" onClick={() => setExpanded((current) => !current)}>
              <PencilLine className="h-4 w-4" />
              {expanded ? "Tutup" : "Edit"}
            </Button>
          ) : (
            <span className="text-sm text-[var(--muted)]">View only</span>
          )}
        </td>
      </tr>

      {canManage && expanded ? (
        <tr>
          <td colSpan={6} className="bg-[var(--surface)] px-5 py-5">
            <div className="rounded-[20px] border border-[var(--border)] bg-white p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-[var(--foreground)]">Edit task</h3>
                  <p className="text-sm text-[var(--muted)]">Perbarui status, timeline, PIC, atau deskripsi task.</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setExpanded(false)}>
                  Tutup panel
                </Button>
              </div>

              <TaskForm
                projectId={projectId}
                taskId={task.id}
                mode="edit"
                members={members}
                initialValues={{
                  title: task.title,
                  description: task.description,
                  status: task.status,
                  priority: task.priority,
                  startDate: task.startDate,
                  dueDate: task.dueDate,
                  assigneeId: task.assigneeId,
                }}
                submitLabel="Simpan perubahan"
              />

              <div className="mt-5 border-t border-[var(--border)] pt-5">
                <FormMessage success={success} message={message} />
                <Button variant="danger" size="sm" onClick={handleDelete} disabled={pending}>
                  <Trash2 className="h-4 w-4" />
                  {pending ? "Menghapus..." : "Hapus task"}
                </Button>
              </div>
            </div>
          </td>
        </tr>
      ) : null}
    </Fragment>
  );
}

export function TaskTable({ projectId, tasks, members, canManage }: TaskTableProps) {
  return (
    <div className="overflow-hidden rounded-[22px] border border-[var(--border)] bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-[var(--border)] text-left">
          <thead className="bg-[var(--surface)]">
            <tr className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
              <th className="px-5 py-4">Task</th>
              <th className="px-5 py-4">Status</th>
              <th className="px-5 py-4">Prioritas</th>
              <th className="px-5 py-4">Timeline</th>
              <th className="px-5 py-4">PIC</th>
              <th className="px-5 py-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {tasks.map((task) => (
              <TaskTableRow
                key={task.id}
                projectId={projectId}
                task={task}
                members={members}
                canManage={canManage}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
