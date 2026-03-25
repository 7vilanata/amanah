import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { LoginForm } from "@/components/forms/login-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const session = await auth();

  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <Card className="mx-auto max-w-xl">
      <CardHeader className="space-y-3">
        <div className="inline-flex w-fit rounded-full bg-[var(--surface)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-strong)]">
          Internal Workspace
        </div>
        <CardTitle className="text-3xl">Masuk ke Amanah Project Hub</CardTitle>
        <CardDescription>
          Gunakan akun internal agency untuk mengakses dashboard project, board task, dan calendar timeline.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <LoginForm />
      </CardContent>
    </Card>
  );
}
