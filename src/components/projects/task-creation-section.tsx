"use client";

import { useEffect, useState } from "react";
import { Plus, Repeat, X } from "lucide-react";
import { createPortal } from "react-dom";

import { RecurringTaskForm } from "@/components/projects/recurring-task-form";
import { TaskForm } from "@/components/projects/task-form";
import { Button } from "@/components/ui/button";

type TaskCreationSectionProps = {
  projectId: string;
  members: Array<{ id: string; name: string }>;
  showRecurringAction?: boolean;
};

type CreationMode = "manual" | "recurring" | null;

export function TaskCreationSection({
  projectId,
  members,
  showRecurringAction = true,
}: TaskCreationSectionProps) {
  const [mode, setMode] = useState<CreationMode>(null);
  const portalTarget = typeof document === "undefined" ? null : document.body;

  useEffect(() => {
    if (!mode) {
      document.body.style.removeProperty("overflow");
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMode(null);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.removeProperty("overflow");
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [mode]);

  return (
    <>
      <section className="rounded-[22px] border border-[var(--border)] bg-white px-5 py-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-[var(--foreground)]">Tambah task</h3>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {showRecurringAction
                ? "Pilih task manual atau recurring dari satu panel yang sama, lalu isi form di popup."
                : "Tambahkan task manual dari panel ini lalu isi form di popup."}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => setMode("manual")}>
              <Plus className="h-4 w-4" />
              Add task
            </Button>
            {showRecurringAction ? (
              <Button variant="secondary" onClick={() => setMode("recurring")}>
                <Repeat className="h-4 w-4" />
                Add recurring task
              </Button>
            ) : null}
          </div>
        </div>
      </section>

      {portalTarget && mode
        ? createPortal(
            <div
              className="fixed inset-0 z-[100] overflow-y-auto overscroll-y-contain bg-[rgba(17,17,17,0.45)] backdrop-blur-sm"
              onClick={() => setMode(null)}
            >
              <div className="flex min-h-dvh items-start justify-center px-4 py-4 md:px-6 md:py-8">
                <div
                  className="flex max-h-[calc(100dvh-2rem)] w-full max-w-4xl flex-col rounded-[24px] border border-[var(--border)] bg-white shadow-[0_28px_80px_-36px_rgba(16,12,8,0.45)] md:max-h-[calc(100dvh-4rem)]"
                  onClick={(event) => event.stopPropagation()}
                >
                  <div className="flex items-start justify-between gap-4 border-b border-[var(--border)] px-6 py-5">
                    <div>
                      <div className="inline-flex rounded-full bg-[var(--surface)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-strong)]">
                        {mode === "manual" ? "Task Manual" : "Task Harian"}
                      </div>
                      <h3 className="mt-3 text-2xl font-semibold text-[var(--foreground)]">
                        {mode === "manual" ? "Tambah task baru" : "Tambah recurring task"}
                      </h3>
                      <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
                        {mode === "manual"
                          ? "Task baru langsung masuk ke task list, board, dan calendar project ini."
                          : "Template recurring akan meng-generate task instance otomatis untuk window operasional 7 hari ke depan."}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setMode(null)}>
                      <X className="h-4 w-4" />
                      Tutup
                    </Button>
                  </div>

                  <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
                    {mode === "manual" ? (
                      <TaskForm
                        projectId={projectId}
                        mode="create"
                        members={members}
                        onSuccess={() => setMode(null)}
                      />
                    ) : (
                      <RecurringTaskForm
                        projectId={projectId}
                        mode="create"
                        members={members}
                        onSuccess={() => setMode(null)}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>,
            portalTarget,
          )
        : null}
    </>
  );
}
