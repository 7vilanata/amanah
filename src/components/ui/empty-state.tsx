import { Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";

type EmptyStateProps = {
  title: string;
  description: string;
  className?: string;
};

export function EmptyState({ title, description, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex min-h-48 flex-col items-center justify-center gap-3 rounded-[20px] border border-dashed border-[var(--border)] bg-[var(--surface)] px-6 py-10 text-center",
        className,
      )}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white">
        <Sparkles className="h-6 w-6 text-[var(--accent)]" />
      </div>
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-[var(--foreground)]">{title}</h3>
        <p className="max-w-md text-sm leading-6 text-[var(--muted)]">{description}</p>
      </div>
    </div>
  );
}
