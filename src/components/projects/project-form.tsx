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
  clientOptions?: string[];
};

const defaultValues: ProjectFormValues = {
  name: "",
  clientName: "",
  description: "",
  status: "PLANNING",
  startDate: new Date(),
  dueDate: new Date(),
};

const CUSTOM_CLIENT_OPTION = "__custom__";

export function ProjectForm({ mode, projectId, initialValues, submitLabel, clientOptions = [] }: ProjectFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const values = useMemo(() => ({ ...defaultValues, ...initialValues }), [initialValues]);
  const normalizedClientOptions = useMemo(
    () =>
      Array.from(
        new Set(
          clientOptions
            .map((client) => client.trim())
            .filter(Boolean),
        ),
      ).sort((left, right) => left.localeCompare(right, "id")),
    [clientOptions],
  );
  const trimmedClientName = values.clientName.trim();
  const initialClientSelection = trimmedClientName
    ? normalizedClientOptions.includes(trimmedClientName)
      ? trimmedClientName
      : CUSTOM_CLIENT_OPTION
    : "";
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[] | undefined>>({});
  const [selectedClient, setSelectedClient] = useState(initialClientSelection);
  const [customClientName, setCustomClientName] = useState(
    initialClientSelection === CUSTOM_CLIENT_OPTION ? trimmedClientName : "",
  );

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const resolvedClientName =
      selectedClient === CUSTOM_CLIENT_OPTION ? customClientName.trim() : selectedClient.trim();

    formData.set("clientName", resolvedClientName);

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
          setSelectedClient("");
          setCustomClientName("");
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
          <input
            type="hidden"
            name="clientName"
            value={selectedClient === CUSTOM_CLIENT_OPTION ? customClientName : selectedClient}
            readOnly
          />
          <Select
            id={`${mode}-project-client`}
            value={selectedClient}
            onChange={(event) => {
              setSelectedClient(event.target.value);

              if (event.target.value !== CUSTOM_CLIENT_OPTION) {
                setCustomClientName("");
              }
            }}
          >
            <option value="">Pilih client</option>
            {normalizedClientOptions.map((client) => (
              <option key={client} value={client}>
                {client}
              </option>
            ))}
            <option value={CUSTOM_CLIENT_OPTION}>+ Tambah client baru</option>
          </Select>
          {selectedClient === CUSTOM_CLIENT_OPTION ? (
            <Input
              value={customClientName}
              onChange={(event) => setCustomClientName(event.target.value)}
              placeholder="Tulis nama client baru"
              required
            />
          ) : null}
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
