import { Sparkles } from "lucide-react";

import { LogoutButton } from "@/components/layout/logout-button";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { Badge } from "@/components/ui/badge";
import { requireSessionUser } from "@/lib/session";
import { roleLabels } from "@/lib/domain";

export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await requireSessionUser();

  return (
    <div className="min-h-screen px-4 py-4 lg:px-6">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] w-full max-w-[1600px] gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="flex flex-col rounded-[24px] border border-[var(--border)] bg-white/75 p-5 shadow-[0_24px_80px_-48px_rgba(26,24,21,0.5)] backdrop-blur">
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 text-base font-semibold tracking-[0.18em] text-[var(--foreground)] uppercase">
                <Sparkles className="h-3.5 w-3.5" />
                Amanah
              </div>
            </div>

            <div className="rounded-[20px] border border-[var(--border)] bg-[var(--surface)] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">Login sebagai</p>
              <p className="mt-3 text-base font-semibold text-[var(--foreground)]">{user.name}</p>
              <p className="mt-1 text-sm text-[var(--muted)]">{user.email}</p>
              <div className="mt-3">
                <Badge>{roleLabels[user.role]}</Badge>
              </div>
            </div>

            <SidebarNav role={user.role} />
          </div>

          <div className="mt-auto pt-6">
            <LogoutButton />
          </div>
        </aside>

        <main className="rounded-[24px] border border-[var(--border)] bg-white/72 p-5 shadow-[0_24px_80px_-48px_rgba(26,24,21,0.45)] backdrop-blur lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
