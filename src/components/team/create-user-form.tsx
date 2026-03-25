"use client";

import { startTransition, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { createUserAction } from "@/actions/team-actions";
import { FormMessage } from "@/components/forms/form-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { roles, roleLabels } from "@/lib/domain";

export function CreateUserForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[] | undefined>>({});

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      setPending(true);
      const result = await createUserAction(formData);
      setPending(false);
      setMessage(result.message);
      setSuccess(result.success);
      setFieldErrors(result.fieldErrors ?? {});

      if (result.success) {
        router.refresh();
        formRef.current?.reset();
      }
    });
  }

  return (
    <form ref={formRef} className="space-y-4" onSubmit={handleSubmit}>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-[var(--muted-strong)]" htmlFor="create-user-name">
            Nama
          </label>
          <Input id="create-user-name" name="name" placeholder="Rizky Creative" required />
          {fieldErrors.name?.[0] ? <p className="text-xs text-[#a53a2f]">{fieldErrors.name[0]}</p> : null}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-[var(--muted-strong)]" htmlFor="create-user-email">
            Email
          </label>
          <Input id="create-user-email" name="email" type="email" placeholder="rizky@agency.com" required />
          {fieldErrors.email?.[0] ? <p className="text-xs text-[#a53a2f]">{fieldErrors.email[0]}</p> : null}
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-[var(--muted-strong)]" htmlFor="create-user-password">
            Password awal
          </label>
          <Input id="create-user-password" name="password" type="password" placeholder="Minimal 8 karakter" required />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-[var(--muted-strong)]" htmlFor="create-user-role">
            Role
          </label>
          <Select id="create-user-role" name="role" defaultValue="MEMBER">
            {roles.map((role) => (
              <option key={role} value={role}>
                {roleLabels[role]}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <FormMessage success={success} message={message} />

      <Button type="submit" disabled={pending}>
        {pending ? "Membuat akun..." : "Buat akun tim"}
      </Button>
    </form>
  );
}
