"use client";

import { startTransition, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { createRecurringTaskAction, updateRecurringTaskAction } from "@/actions/recurring-task-actions";
import { FormMessage } from "@/components/forms/form-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  recurringTaskFrequencies,
  recurringTaskFrequencyLabels,
  taskPriorities,
  taskPriorityLabels,
  type RecurringTaskFrequency,
  type TaskPriority,
} from "@/lib/domain";
import { formatDateInput } from "@/lib/utils";

type RecurringTaskFormValues = {
  title: string;
  description?: string | null;
  priority: TaskPriority;
  frequency: RecurringTaskFrequency;
  interval: number | string;
  startDate: Date | string;
  endDate?: Date | string | null;
  assigneeId?: string | null;
};

type RecurringTaskFormProps = {
  projectId: string;
  recurringTaskId?: string;
  mode: "create" | "edit";
  members: Array<{ id: string; name: string }>;
  initialValues?: Partial<RecurringTaskFormValues>;
  submitLabel?: string;
  onSuccess?: () => void;
};

const defaultValues: RecurringTaskFormValues = {
  title: "",
  description: "",
  priority: "MEDIUM",
  frequency: "DAILY",
  interval: 1,
  startDate: new Date(),
  endDate: "",
  assigneeId: "",
};

export function RecurringTaskForm({
  projectId,
  recurringTaskId,
  mode,
  members,
  initialValues,
  submitLabel,
  onSuccess,
}: RecurringTaskFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const values = useMemo(() => ({ ...defaultValues, ...initialValues }), [initialValues]);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[] | undefined>>({});

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    formData.set("projectId", projectId);

    if (recurringTaskId) {
      formData.set("recurringTaskId", recurringTaskId);
    }

    startTransition(async () => {
      setPending(true);
      setMessage(null);
      setFieldErrors({});

      const result =
        mode === "create"
          ? await createRecurringTaskAction(formData)
          : await updateRecurringTaskAction(formData);

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
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-[var(--muted-strong)]" htmlFor={`${mode}-recurring-task-title`}>
            Nama task harian
          </label>
          <Input
            id={`${mode}-recurring-task-title`}
            name="title"
            defaultValue={values.title}
            placeholder="Review leads masuk harian"
            required
          />
          {fieldErrors.title?.[0] ? <p className="text-xs text-[#a53a2f]">{fieldErrors.title[0]}</p> : null}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-[var(--muted-strong)]" htmlFor={`${mode}-recurring-task-assignee`}>
            PIC default
          </label>
          <Select id={`${mode}-recurring-task-assignee`} name="assigneeId" defaultValue={values.assigneeId ?? ""}>
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
          <label className="text-sm font-medium text-[var(--muted-strong)]" htmlFor={`${mode}-recurring-task-frequency`}>
            Pola
          </label>
          <Select id={`${mode}-recurring-task-frequency`} name="frequency" defaultValue={values.frequency}>
            {recurringTaskFrequencies.map((frequency) => (
              <option key={frequency} value={frequency}>
                {recurringTaskFrequencyLabels[frequency]}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-[var(--muted-strong)]" htmlFor={`${mode}-recurring-task-interval`}>
            Interval
          </label>
          <Input
            id={`${mode}-recurring-task-interval`}
            name="interval"
            type="number"
            min={1}
            defaultValue={String(values.interval)}
          />
          {fieldErrors.interval?.[0] ? <p className="text-xs text-[#a53a2f]">{fieldErrors.interval[0]}</p> : null}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-[var(--muted-strong)]" htmlFor={`${mode}-recurring-task-start`}>
            Tanggal mulai
          </label>
          <Input
            id={`${mode}-recurring-task-start`}
            name="startDate"
            type="date"
            defaultValue={formatDateInput(values.startDate)}
            required
          />
          {fieldErrors.startDate?.[0] ? <p className="text-xs text-[#a53a2f]">{fieldErrors.startDate[0]}</p> : null}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-[var(--muted-strong)]" htmlFor={`${mode}-recurring-task-end`}>
            Tanggal selesai
          </label>
          <Input
            id={`${mode}-recurring-task-end`}
            name="endDate"
            type="date"
            defaultValue={values.endDate ? formatDateInput(values.endDate) : ""}
          />
          {fieldErrors.endDate?.[0] ? <p className="text-xs text-[#a53a2f]">{fieldErrors.endDate[0]}</p> : null}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
        <div className="space-y-2">
          <label className="text-sm font-medium text-[var(--muted-strong)]" htmlFor={`${mode}-recurring-task-description`}>
            Deskripsi
          </label>
          <Textarea
            id={`${mode}-recurring-task-description`}
            name="description"
            defaultValue={values.description ?? ""}
            placeholder="Checklist singkat atau output yang harus dikerjakan setiap hari."
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-[var(--muted-strong)]" htmlFor={`${mode}-recurring-task-priority`}>
            Prioritas default
          </label>
          <Select id={`${mode}-recurring-task-priority`} name="priority" defaultValue={values.priority}>
            {taskPriorities.map((priority) => (
              <option key={priority} value={priority}>
                {taskPriorityLabels[priority]}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <FormMessage success={success} message={message} />

      <Button type="submit" disabled={pending}>
        {pending ? "Menyimpan..." : submitLabel ?? (mode === "create" ? "Tambah task harian" : "Simpan perubahan")}
      </Button>
    </form>
  );
}
