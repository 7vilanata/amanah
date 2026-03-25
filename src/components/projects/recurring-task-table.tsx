"use client";

import { Fragment, startTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { PauseCircle, PencilLine, PlayCircle, Trash2 } from "lucide-react";

import {
  deleteRecurringTaskAction,
  toggleRecurringTaskAction,
} from "@/actions/recurring-task-actions";
import { FormMessage } from "@/components/forms/form-message";
import { RecurringTaskForm } from "@/components/projects/recurring-task-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { taskPriorityLabels, taskPriorityTone, type RecurringTaskFrequency, type TaskPriority } from "@/lib/domain";
import { recurringPatternLabel } from "@/lib/recurring-task-utils";
import { formatDate, formatDateRange } from "@/lib/utils";

type RecurringTaskTableProps = {
  projectId: string;
  recurringTasks: Array<{
    id: string;
    title: string;
    description: string | null;
    priority: TaskPriority;
    frequency: RecurringTaskFrequency;
    interval: number;
    startDate: Date;
    endDate: Date | null;
    isActive: boolean;
    defaultAssigneeId: string | null;
    defaultAssigneeName: string | null;
  }>;
  members: Array<{ id: string; name: string }>;
  canManage: boolean;
};

type RecurringTaskRowProps = {
  projectId: string;
  recurringTask: RecurringTaskTableProps["recurringTasks"][number];
  members: RecurringTaskTableProps["members"];
  canManage: boolean;
};

function RecurringTaskRow({ projectId, recurringTask, members, canManage }: RecurringTaskRowProps) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function handleToggle() {
    startTransition(async () => {
      setPending(true);
      const result = await toggleRecurringTaskAction(recurringTask.id, !recurringTask.isActive);
      setPending(false);
      setMessage(result.message);
      setSuccess(result.success);

      if (result.success) {
        router.refresh();
      }
    });
  }

  function handleDelete() {
    if (!window.confirm("Hapus template task harian ini?")) {
      return;
    }

    startTransition(async () => {
      setPending(true);
      const result = await deleteRecurringTaskAction(recurringTask.id);
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
            <div className="text-sm font-semibold text-[var(--foreground)]">{recurringTask.title}</div>
            <p className="max-w-xl overflow-hidden text-sm leading-6 text-[var(--muted)] [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
              {recurringTask.description || "Belum ada deskripsi tambahan."}
            </p>
          </div>
        </td>
        <td className="px-5 py-4 text-sm text-[var(--muted-strong)]">
          {recurringPatternLabel(recurringTask.frequency, recurringTask.interval)}
        </td>
        <td className="px-5 py-4">
          <Badge tone={taskPriorityTone[recurringTask.priority]}>{taskPriorityLabels[recurringTask.priority]}</Badge>
        </td>
        <td className="px-5 py-4 text-sm leading-6 text-[var(--muted-strong)]">
          {recurringTask.endDate
            ? formatDateRange(recurringTask.startDate, recurringTask.endDate)
            : `Mulai ${formatDate(recurringTask.startDate)}`}
        </td>
        <td className="px-5 py-4 text-sm text-[var(--muted-strong)]">
          {recurringTask.defaultAssigneeName || "Belum ada PIC"}
        </td>
        <td className="px-5 py-4">
          <Badge tone={recurringTask.isActive ? "success" : "neutral"}>
            {recurringTask.isActive ? "Aktif" : "Jeda"}
          </Badge>
        </td>
        <td className="px-5 py-4 text-right">
          {canManage ? (
            <Button variant="secondary" size="sm" onClick={() => setExpanded((current) => !current)}>
              <PencilLine className="h-4 w-4" />
              {expanded ? "Tutup" : "Kelola"}
            </Button>
          ) : (
            <span className="text-sm text-[var(--muted)]">View only</span>
          )}
        </td>
      </tr>

      {canManage && expanded ? (
        <tr>
          <td colSpan={7} className="bg-[var(--surface)] px-5 py-5">
            <div className="rounded-[20px] border border-[var(--border)] bg-white p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-[var(--foreground)]">Kelola task harian</h3>
                  <p className="text-sm text-[var(--muted)]">
                    Update pola, PIC default, atau jeda template ini tanpa mengubah task instance yang sudah ada.
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setExpanded(false)}>
                  Tutup panel
                </Button>
              </div>

              <RecurringTaskForm
                projectId={projectId}
                recurringTaskId={recurringTask.id}
                mode="edit"
                members={members}
                initialValues={{
                  title: recurringTask.title,
                  description: recurringTask.description,
                  priority: recurringTask.priority,
                  frequency: recurringTask.frequency,
                  interval: recurringTask.interval,
                  startDate: recurringTask.startDate,
                  endDate: recurringTask.endDate,
                  assigneeId: recurringTask.defaultAssigneeId,
                }}
                submitLabel="Simpan template"
              />

              <div className="mt-5 flex flex-wrap gap-3 border-t border-[var(--border)] pt-5">
                <Button variant="secondary" size="sm" onClick={handleToggle} disabled={pending}>
                  {recurringTask.isActive ? <PauseCircle className="h-4 w-4" /> : <PlayCircle className="h-4 w-4" />}
                  {pending ? "Memproses..." : recurringTask.isActive ? "Jeda template" : "Aktifkan kembali"}
                </Button>
                <Button variant="danger" size="sm" onClick={handleDelete} disabled={pending}>
                  <Trash2 className="h-4 w-4" />
                  {pending ? "Menghapus..." : "Hapus template"}
                </Button>
              </div>

              <div className="mt-4">
                <FormMessage success={success} message={message} />
              </div>
            </div>
          </td>
        </tr>
      ) : null}
    </Fragment>
  );
}

export function RecurringTaskTable({
  projectId,
  recurringTasks,
  members,
  canManage,
}: RecurringTaskTableProps) {
  return (
    <div className="overflow-hidden rounded-[22px] border border-[var(--border)] bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-[var(--border)] text-left">
          <thead className="bg-[var(--surface)]">
            <tr className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
              <th className="px-5 py-4">Template</th>
              <th className="px-5 py-4">Pola</th>
              <th className="px-5 py-4">Prioritas</th>
              <th className="px-5 py-4">Periode</th>
              <th className="px-5 py-4">PIC default</th>
              <th className="px-5 py-4">Status</th>
              <th className="px-5 py-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {recurringTasks.map((recurringTask) => (
              <RecurringTaskRow
                key={recurringTask.id}
                projectId={projectId}
                recurringTask={recurringTask}
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
