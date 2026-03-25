"use client";

import { startTransition, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { ProjectStatus } from "@/lib/domain";

import { createProjectAction, updateProjectAction } from "@/actions/project-actions";
import { FormMessage } from "@/components/forms/form-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { projectStatusLabels, projectStatuses } from "@/lib/domain";
import { formatDateInput } from "@/lib/utils";

type ProjectFormValues = {
  name: string;
  clientName: string;
  description?: string | null;
  status: ProjectStatus;
  startDate: Date | string;
  dueDate: Date | string;
};

type ProjectFormProps = {
  mode: "create" | "edit";
  projectId?: string;
  initialValues?: Partial<ProjectFormValues>;
  submitLabel?: string;
};

const defaultValues: ProjectFormValues = {
  name: "",
  clientName: "",
  description: "",
  status: "PLANNING",
  startDate: new Date(),
  dueDate: new Date(),
};

export function ProjectForm({ mode, projectId, initialValues, submitLabel }: ProjectFormProps) {
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

    if (projectId) {
      formData.set("projectId", projectId);
    }

    startTransition(async () => {
      setPending(true);
      setMessage(null);
      setFieldErrors({});

      const result =
        mode === "create" ? await createProjectAction(formData) : await updateProjectAction(formData);

      setPending(false);
      setMessage(result.message);
      setSuccess(result.success);
      setFieldErrors(result.fieldErrors ?? {});

      if (result.success) {
        router.refresh();

        if (mode === "create") {
          formRef.current?.reset();
        }
      }
    });
  }

  return (
    <form ref={formRef} className="space-y-4" onSubmit={handleSubmit}>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-[var(--muted-strong)]" htmlFor={`${mode}-project-name`}>
            Nama project
          </label>
          <Input
            id={`${mode}-project-name`}
            name="name"
            defaultValue={values.name}
            placeholder="Website Retainer April"
            required
          />
          {fieldErrors.name?.[0] ? <p className="text-xs text-[#a53a2f]">{fieldErrors.name[0]}</p> : null}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-[var(--muted-strong)]" htmlFor={`${mode}-project-client`}>
            Nama client
          </label>
          <Input
            id={`${mode}-project-client`}
            name="clientName"
            defaultValue={values.clientName}
            placeholder="PT Contoh Makmur"
            required
          />
          {fieldErrors.clientName?.[0] ? <p className="text-xs text-[#a53a2f]">{fieldErrors.clientName[0]}</p> : null}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <label className="text-sm font-medium text-[var(--muted-strong)]" htmlFor={`${mode}-project-status`}>
            Status
          </label>
          <Select id={`${mode}-project-status`} name="status" defaultValue={values.status}>
            {projectStatuses.map((status) => (
              <option key={status} value={status}>
                {projectStatusLabels[status]}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-[var(--muted-strong)]" htmlFor={`${mode}-project-start`}>
            Tanggal mulai
          </label>
          <Input
            id={`${mode}-project-start`}
            name="startDate"
            type="date"
            defaultValue={formatDateInput(values.startDate)}
            required
          />
          {fieldErrors.startDate?.[0] ? <p className="text-xs text-[#a53a2f]">{fieldErrors.startDate[0]}</p> : null}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-[var(--muted-strong)]" htmlFor={`${mode}-project-due`}>
            Tanggal selesai
          </label>
          <Input
            id={`${mode}-project-due`}
            name="dueDate"
            type="date"
            defaultValue={formatDateInput(values.dueDate)}
            required
          />
          {fieldErrors.dueDate?.[0] ? <p className="text-xs text-[#a53a2f]">{fieldErrors.dueDate[0]}</p> : null}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-[var(--muted-strong)]" htmlFor={`${mode}-project-description`}>
          Deskripsi singkat
        </label>
        <Textarea
          id={`${mode}-project-description`}
          name="description"
          defaultValue={values.description ?? ""}
          placeholder="Tuliskan objective, deliverables, atau konteks penting project."
        />
      </div>

      <FormMessage success={success} message={message} />

      <Button type="submit" disabled={pending}>
        {pending ? "Menyimpan..." : submitLabel ?? (mode === "create" ? "Tambah project" : "Simpan perubahan")}
      </Button>
    </form>
  );
}
