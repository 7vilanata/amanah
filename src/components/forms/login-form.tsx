"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { LockKeyhole, Mail } from "lucide-react";

import { FormMessage } from "@/components/forms/form-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function LoginForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    startTransition(async () => {
      setPending(true);
      setMessage(null);

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setMessage("Email atau password tidak valid.");
        setPending(false);
        return;
      }

      router.push("/dashboard");
      router.refresh();
      setPending(false);
    });
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <label className="text-sm font-medium text-[var(--muted-strong)]" htmlFor="email">
          Email
        </label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
          <Input id="email" name="email" type="email" placeholder="owner@agency.com" className="pl-11" required />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-[var(--muted-strong)]" htmlFor="password">
          Password
        </label>
        <div className="relative">
          <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="Minimal 8 karakter"
            className="pl-11"
            required
          />
        </div>
      </div>

      <FormMessage message={message} />

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? "Memproses..." : "Masuk ke Workspace"}
      </Button>
    </form>
  );
}
