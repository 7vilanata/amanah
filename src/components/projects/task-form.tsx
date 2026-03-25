"use client";

import { startTransition, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { TaskPriority, TaskStatus } from "@/lib/domain";

import { createTaskAction, updateTaskAction } from "@/actions/task-actions";
import { FormMessage } from "@/components/forms/form-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { taskPriorities, taskPriorityLabels, taskStatuses, taskStatusLabels } from "@/lib/domain";
import { formatDateInput } from "@/lib/utils";

type TaskFormValues = {
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  startDate: Date | string;
  dueDate: Date | string;
  assigneeId?: string | null;
};

type TaskFormProps = {
  projectId: string;
  taskId?: string;
  mode: "create" | "edit";
  members: Array<{ id: string; name: string }>;
  initialValues?: Partial<TaskFormValues>;
  submitLabel?: string;
  onSuccess?: () => void;
  editableScope?: "all" | "member";
};

const defaultValues: TaskFormValues = {
  title: "",
  description: "",
  status: "TODO",
  priority: "MEDIUM",
  startDate: new Date(),
  dueDate: new Date(),
  assigneeId: "",
};

export function TaskForm({
  projectId,
  taskId,
  mode,
  members,
  initialValues,
  submitLabel,
  onSuccess,
  editableScope = "all",
}: TaskFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const values = useMemo(() => ({ ...defaultValues, ...initialValues }), [initialValues]);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[] | undefined>>({});
  const memberEditMode = mode === "edit" && editableScope === "member";

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    formData.set("projectId", projectId);

    if (taskId) {
      formData.set("taskId", taskId);
    }

    startTransition(async () => {
      setPending(true);
      setMessage(null);
      setFieldErrors({});

      const result = mode === "create" ? await createTaskAction(formData) : await updateTaskAction(formData);

      setPending(false);
      setMessage(result.message);
      setSuccess(result.success);
      setFieldErrors(result.fieldErrors ?? {});

      if (result.success) {
        router.refresh();

        if (mode === "create") {
          formRef.current?.reset();
        }

        onSuccess?.();
      }
    });
  }

  return (
    <form ref={formRef} className="space-y-4" onSubmit={handleSubmit}>
      {memberEditMode ? (
        <>
          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--muted-strong)]" htmlFor={`${mode}-task-status`}>
              Status
            </label>
            <Select id={`${mode}-task-status`} name="status" defaultValue={values.status}>
              {taskStatuses.map((status) => (
                <option key={status} value={status}>
                  {taskStatusLabels[status]}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--muted-strong)]" htmlFor={`${mode}-task-description`}>
              Deskripsi
            </label>
            <Textarea
              id={`${mode}-task-description`}
              name="description"
              defaultValue={values.description ?? ""}
              placeholder="Tuliskan detail, referensi, atau hasil yang diharapkan."
            />
          </div>
        </>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--muted-strong)]" htmlFor={`${mode}-task-title`}>
                Nama task
              </label>
              <Input
                id={`${mode}-task-title`}
                name="title"
                defaultValue={values.title}
                placeholder="Siapkan headline hero section"
                required
              />
              {fieldErrors.title?.[0] ? <p className="text-xs text-[#a53a2f]">{fieldErrors.title[0]}</p> : null}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--muted-strong)]" htmlFor={`${mode}-task-assignee`}>
                PIC
              </label>
              <Select id={`${mode}-task-assignee`} name="assigneeId" defaultValue={values.assigneeId ?? ""}>
                <option value="">Belum ditentukan</option>
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--muted-strong)]" htmlFor={`${mode}-task-status`}>
                Status
              </label>
              <Select id={`${mode}-task-status`} name="status" defaultValue={values.status}>
                {taskStatuses.map((status) => (
                  <option key={status} value={status}>
                    {taskStatusLabels[status]}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--muted-strong)]" htmlFor={`${mode}-task-priority`}>
                Prioritas
              </label>
              <Select id={`${mode}-task-priority`} name="priority" defaultValue={values.priority}>
                {taskPriorities.map((priority) => (
                  <option key={priority} value={priority}>
                    {taskPriorityLabels[priority]}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--muted-strong)]" htmlFor={`${mode}-task-start`}>
                Start date
              </label>
              <Input
                id={`${mode}-task-start`}
                name="startDate"
                type="date"
                defaultValue={formatDateInput(values.startDate)}
                required
              />
              {fieldErrors.startDate?.[0] ? <p className="text-xs text-[#a53a2f]">{fieldErrors.startDate[0]}</p> : null}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--muted-strong)]" htmlFor={`${mode}-task-due`}>
                Due date
              </label>
              <Input
                id={`${mode}-task-due`}
                name="dueDate"
                type="date"
                defaultValue={formatDateInput(values.dueDate)}
                required
              />
              {fieldErrors.dueDate?.[0] ? <p className="text-xs text-[#a53a2f]">{fieldErrors.dueDate[0]}</p> : null}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--muted-strong)]" htmlFor={`${mode}-task-description`}>
              Deskripsi
            </label>
            <Textarea
              id={`${mode}-task-description`}
              name="description"
              defaultValue={values.description ?? ""}
              placeholder="Tuliskan detail, referensi, atau hasil yang diharapkan."
            />
          </div>
        </>
      )}

      <FormMessage success={success} message={message} />

      <Button type="submit" disabled={pending}>
        {pending ? "Menyimpan..." : submitLabel ?? (mode === "create" ? "Tambah task" : "Simpan task")}
      </Button>
    </form>
  );
}
