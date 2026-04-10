"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Plus, X } from "lucide-react";

import { TaskForm } from "@/components/projects/task-form";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";

type GlobalTaskProject = {
  id: string;
  name: string;
  clientName: string;
  members: Array<{
    id: string;
    name: string;
  }>;
};

type GlobalTaskCreationButtonProps = {
  projects: GlobalTaskProject[];
};

export function GlobalTaskCreationButton({ projects }: GlobalTaskCreationButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState(projects[0]?.id ?? "");
  const portalTarget = typeof document === "undefined" ? null : document.body;
  const hasProjects = projects.length > 0;
  const resolvedProjectId =
    selectedProjectId && projects.some((project) => project.id === selectedProjectId)
      ? selectedProjectId
      : (projects[0]?.id ?? "");
  const selectedProject = projects.find((project) => project.id === resolvedProjectId) ?? null;

  useEffect(() => {
    if (!isOpen) {
      document.body.style.removeProperty("overflow");
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.removeProperty("overflow");
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <>
      <Button onClick={() => setIsOpen(true)} disabled={!hasProjects}>
        <Plus className="h-4 w-4" />
        Add task
      </Button>

      {portalTarget && isOpen
        ? createPortal(
            <div
              className="fixed inset-0 z-[100] overflow-y-auto overscroll-y-contain bg-[rgba(17,17,17,0.45)] backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            >
              <div className="flex min-h-dvh items-start justify-center px-4 py-4 md:px-6 md:py-8">
                <div
                  className="flex max-h-[calc(100dvh-2rem)] w-full max-w-4xl flex-col rounded-[24px] border border-[var(--border)] bg-white shadow-[0_28px_80px_-36px_rgba(16,12,8,0.45)] md:max-h-[calc(100dvh-4rem)]"
                  onClick={(event) => event.stopPropagation()}
                >
                  <div className="flex items-start justify-between gap-4 border-b border-[var(--border)] px-6 py-5">
                    <div>
                      <div className="inline-flex rounded-full bg-[var(--surface)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-strong)]">
                        Task Manual
                      </div>
                      <h3 className="mt-3 text-2xl font-semibold text-[var(--foreground)]">Tambah task baru</h3>
                      <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
                        Pilih project aktif terlebih dulu, lalu isi detail task yang ingin dibuat.
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
                      <X className="h-4 w-4" />
                      Tutup
                    </Button>
                  </div>

                  <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
                    {selectedProject ? (
                      <div className="space-y-6">
                        <div className="grid gap-4 rounded-[20px] border border-[var(--border)] bg-[var(--surface)] p-5 md:grid-cols-[minmax(0,1fr)_220px]">
                          <div className="space-y-2">
                            <label
                              className="text-sm font-medium text-[var(--muted-strong)]"
                              htmlFor="global-task-project"
                            >
                              Project
                            </label>
                            <Select
                              id="global-task-project"
                              value={resolvedProjectId}
                              onChange={(event) => setSelectedProjectId(event.target.value)}
                            >
                              {projects.map((project) => (
                                <option key={project.id} value={project.id}>
                                  {project.name}
                                </option>
                              ))}
                            </Select>
                            <p className="text-sm text-[var(--muted)]">
                              Client {selectedProject.clientName} dengan {selectedProject.members.length} member aktif.
                            </p>
                          </div>
                          <div className="rounded-[18px] border border-[var(--border)] bg-white px-4 py-4">
                            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                              PIC options
                            </div>
                            <p className="mt-2 text-sm leading-6 text-[var(--muted-strong)]">
                              {selectedProject.members.length
                                ? selectedProject.members.map((member) => member.name).slice(0, 3).join(", ")
                                : "Project ini belum punya member, jadi PIC bisa dikosongkan dulu."}
                              {selectedProject.members.length > 3 ? "..." : ""}
                            </p>
                          </div>
                        </div>

                        <TaskForm
                          key={selectedProject.id}
                          projectId={selectedProject.id}
                          mode="create"
                          members={selectedProject.members}
                          onSuccess={() => setIsOpen(false)}
                        />
                      </div>
                    ) : (
                      <div className="rounded-[20px] border border-[var(--border)] bg-[var(--surface)] px-5 py-6 text-sm text-[var(--muted)]">
                        Tidak ada project aktif yang bisa dipakai untuk membuat task baru.
                      </div>
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
