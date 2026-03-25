"use client";

import { Fragment, startTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { PauseCircle, PencilLine, PlayCircle, Trash2 } from "lucide-react";

import { deleteRecurringTaskAction, toggleRecurringTaskAction } from "@/actions/recurring-task-actions";
import { deleteTaskAction } from "@/actions/task-actions";
import { FormMessage } from "@/components/forms/form-message";
import { RecurringTaskForm } from "@/components/projects/recurring-task-form";
import { TaskForm } from "@/components/projects/task-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  taskPriorityLabels,
  taskPriorityTone,
  taskStatusLabels,
  taskStatusTone,
  type RecurringTaskFrequency,
  type TaskPriority,
  type TaskStatus,
} from "@/lib/domain";
import { recurringPatternLabel } from "@/lib/recurring-task-utils";
import { formatDate, formatDateRange } from "@/lib/utils";

type MemberOption = {
  id: string;
  name: string;
};

type ManualTask = {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  startDate: Date;
  dueDate: Date;
  assigneeId: string | null;
  assigneeName: string | null;
};

type RecurringTemplate = {
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
};

type ProjectTaskListTableProps = {
  projectId: string;
  tasks: ManualTask[];
  recurringTasks: RecurringTemplate[];
  members: MemberOption[];
  canEditTasks: boolean;
  canManageTaskFields: boolean;
  canManageRecurringTemplates: boolean;
};

type ManualTaskRowProps = {
  projectId: string;
  task: ManualTask;
  members: MemberOption[];
  canEdit: boolean;
  canManageTaskFields: boolean;
};

type RecurringTemplateRowProps = {
  projectId: string;
  recurringTask: RecurringTemplate;
  members: MemberOption[];
  canManageRecurringTemplates: boolean;
};

function ManualTaskRow({ projectId, task, members, canEdit, canManageTaskFields }: ManualTaskRowProps) {
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
              <Badge tone="neutral">Task</Badge>
            </div>
            <p className="max-w-xl overflow-hidden text-sm leading-6 text-[var(--muted)] [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
              {task.description || "Task belum punya deskripsi tambahan."}
            </p>
          </div>
        </td>
        <td className="px-5 py-4 text-sm text-[var(--muted-strong)]">Manual</td>
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
          {canEdit ? (
            <Button variant="secondary" size="sm" onClick={() => setExpanded((current) => !current)}>
              <PencilLine className="h-4 w-4" />
              {expanded ? "Tutup" : "Kelola"}
            </Button>
          ) : (
            <span className="text-sm text-[var(--muted)]">View only</span>
          )}
        </td>
      </tr>

      {canEdit && expanded ? (
        <tr>
          <td colSpan={7} className="bg-[var(--surface)] px-5 py-5">
            <div className="rounded-[20px] border border-[var(--border)] bg-white p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-[var(--foreground)]">Edit task manual</h3>
                  <p className="text-sm text-[var(--muted)]">
                    {canManageTaskFields
                      ? "Perbarui status, timeline, PIC, atau deskripsi task."
                      : "Role member hanya bisa memperbarui status dan deskripsi task."}
                  </p>
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
                editableScope={canManageTaskFields ? "all" : "member"}
                submitLabel="Simpan perubahan"
              />

              {canManageTaskFields ? (
                <div className="mt-5 border-t border-[var(--border)] pt-5">
                  <FormMessage success={success} message={message} />
                  <Button variant="danger" size="sm" onClick={handleDelete} disabled={pending}>
                    <Trash2 className="h-4 w-4" />
                    {pending ? "Menghapus..." : "Hapus task"}
                  </Button>
                </div>
              ) : null}
            </div>
          </td>
        </tr>
      ) : null}
    </Fragment>
  );
}

function RecurringTemplateRow({
  projectId,
  recurringTask,
  members,
  canManageRecurringTemplates,
}: RecurringTemplateRowProps) {
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
            <div className="flex flex-wrap items-center gap-2">
              <div className="text-sm font-semibold text-[var(--foreground)]">{recurringTask.title}</div>
              <Badge tone="neutral">Template harian</Badge>
            </div>
            <p className="max-w-xl overflow-hidden text-sm leading-6 text-[var(--muted)] [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
              {recurringTask.description || "Belum ada deskripsi tambahan."}
            </p>
          </div>
        </td>
        <td className="px-5 py-4 text-sm text-[var(--muted-strong)]">Recurring</td>
        <td className="px-5 py-4">
          <div className="space-y-2">
            <div className="text-sm text-[var(--muted-strong)]">
              {recurringPatternLabel(recurringTask.frequency, recurringTask.interval)}
            </div>
            <Badge tone={recurringTask.isActive ? "success" : "neutral"}>
              {recurringTask.isActive ? "Aktif" : "Jeda"}
            </Badge>
          </div>
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
        <td className="px-5 py-4 text-right">
          {canManageRecurringTemplates ? (
            <Button variant="secondary" size="sm" onClick={() => setExpanded((current) => !current)}>
              <PencilLine className="h-4 w-4" />
              {expanded ? "Tutup" : "Kelola"}
            </Button>
          ) : (
            <span className="text-sm text-[var(--muted)]">View only</span>
          )}
        </td>
      </tr>

      {canManageRecurringTemplates && expanded ? (
        <tr>
          <td colSpan={7} className="bg-[var(--surface)] px-5 py-5">
            <div className="rounded-[20px] border border-[var(--border)] bg-white p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-[var(--foreground)]">Kelola template task harian</h3>
                  <p className="text-sm text-[var(--muted)]">
                    Update pola, PIC default, atau jeda template ini tanpa menampilkan instance harian di tabel.
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

export function ProjectTaskListTable({
  projectId,
  tasks,
  recurringTasks,
  members,
  canEditTasks,
  canManageTaskFields,
  canManageRecurringTemplates,
}: ProjectTaskListTableProps) {
  const hasRows = tasks.length || recurringTasks.length;

  if (!hasRows) {
    return null;
  }

  return (
    <div className="overflow-hidden rounded-[22px] border border-[var(--border)] bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-[var(--border)] text-left">
          <thead className="bg-[var(--surface)]">
            <tr className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
              <th className="px-5 py-4">Item</th>
              <th className="px-5 py-4">Jenis</th>
              <th className="px-5 py-4">Status / Pola</th>
              <th className="px-5 py-4">Prioritas</th>
              <th className="px-5 py-4">Timeline</th>
              <th className="px-5 py-4">PIC</th>
              <th className="px-5 py-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {tasks.map((task) => (
              <ManualTaskRow
                key={`task-${task.id}`}
                projectId={projectId}
                task={task}
                members={members}
                canEdit={canEditTasks}
                canManageTaskFields={canManageTaskFields}
              />
            ))}
            {recurringTasks.map((recurringTask) => (
              <RecurringTemplateRow
                key={`recurring-${recurringTask.id}`}
                projectId={projectId}
                recurringTask={recurringTask}
                members={members}
                canManageRecurringTemplates={canManageRecurringTemplates}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
