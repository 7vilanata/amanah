"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, Trash2 } from "lucide-react";

import { deleteTaskAction } from "@/actions/task-actions";
import { FormMessage } from "@/components/forms/form-message";
import { TaskForm } from "@/components/projects/task-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { taskPriorityLabels, taskPriorityTone, taskStatusLabels, taskStatusTone } from "@/lib/domain";
import { formatDateRange } from "@/lib/utils";

type TaskCardProps = {
  task: {
    id: string;
    title: string;
    description: string | null;
    status: "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE";
    priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
    startDate: Date;
    dueDate: Date;
    assigneeId: string | null;
    assigneeName: string | null;
  };
  projectId: string;
  members: Array<{ id: string; name: string }>;
  canManage: boolean;
};

export function TaskCard({ task, projectId, members, canManage }: TaskCardProps) {
  const router = useRouter();
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
    <Card>
      <CardContent className="space-y-4 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-semibold text-[var(--foreground)]">{task.title}</h3>
              <Badge tone={taskStatusTone[task.status]}>{taskStatusLabels[task.status]}</Badge>
              <Badge tone={taskPriorityTone[task.priority]}>{taskPriorityLabels[task.priority]}</Badge>
            </div>
            <p className="text-sm leading-6 text-[var(--muted)]">
              {task.description || "Task belum punya deskripsi tambahan."}
            </p>
          </div>
          <div className="space-y-2 text-right text-sm text-[var(--muted-strong)]">
            <div className="flex items-center justify-end gap-2">
              <CalendarClock className="h-4 w-4" />
              {formatDateRange(task.startDate, task.dueDate)}
            </div>
            <div>{task.assigneeName || "Belum ada PIC"}</div>
          </div>
        </div>

        <FormMessage success={success} message={message} />

        {canManage ? (
          <details className="rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-4">
            <summary className="cursor-pointer list-none text-sm font-semibold text-[var(--foreground)]">
              Edit task
            </summary>
            <div className="mt-4 space-y-4 border-t border-[var(--border)] pt-4">
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
              />
              <Button variant="danger" onClick={handleDelete} disabled={pending}>
                <Trash2 className="h-4 w-4" />
                {pending ? "Menghapus..." : "Hapus task"}
              </Button>
            </div>
          </details>
        ) : null}
      </CardContent>
    </Card>
  );
}
