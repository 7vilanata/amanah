"use client";

import { startTransition, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { DragEndEvent } from "@dnd-kit/core";
import { DndContext, useDraggable, useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

import { moveTaskAction } from "@/actions/task-actions";
import { FormMessage } from "@/components/forms/form-message";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { taskPriorityLabels, taskPriorityTone, taskStatusLabels, taskStatuses } from "@/lib/domain";
import type { TaskPriority, TaskStatus } from "@/lib/domain";
import { formatDate } from "@/lib/utils";

type BoardTask = {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  assigneeName: string | null;
};

type ProjectBoardProps = {
  tasks: BoardTask[];
};

function DraggableTask({ task }: { task: BoardTask }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Translate.toString(transform),
      }}
      data-testid={`board-task-${task.id}`}
      className={`rounded-[24px] border border-[var(--border)] bg-white p-4 shadow-sm ${isDragging ? "opacity-60" : ""}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <p className="font-medium text-[var(--foreground)]">{task.title}</p>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={taskPriorityTone[task.priority]}>{taskPriorityLabels[task.priority]}</Badge>
            <span className="text-xs text-[var(--muted)]">Due {formatDate(task.dueDate)}</span>
          </div>
        </div>
        <button
          type="button"
          className="rounded-full border border-[var(--border)] p-2 text-[var(--muted)] hover:text-[var(--foreground)]"
          {...listeners}
          {...attributes}
        >
          <GripVertical className="h-4 w-4" />
        </button>
      </div>
      <p className="mt-3 text-sm text-[var(--muted)]">{task.assigneeName || "Belum ada PIC"}</p>
    </div>
  );
}

function BoardColumn({ status, tasks }: { status: TaskStatus; tasks: BoardTask[] }) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  });

  return (
    <div
      ref={setNodeRef}
      data-testid={`board-column-${status}`}
      className={`flex min-h-[420px] flex-col gap-3 rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-4 ${
        isOver ? "border-[var(--accent)] bg-[color:color-mix(in_srgb,var(--accent)_7%,white)]" : ""
      }`}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--muted-strong)]">
          {taskStatusLabels[status]}
        </h3>
        <Badge>{tasks.length}</Badge>
      </div>
      <div className="space-y-3">
        {tasks.map((task) => (
          <DraggableTask key={task.id} task={task} />
        ))}
      </div>
    </div>
  );
}

export function ProjectBoard({ tasks }: ProjectBoardProps) {
  const router = useRouter();
  const [items, setItems] = useState(tasks);
  const [message, setMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(true);

  const grouped = useMemo(
    () =>
      taskStatuses.reduce(
        (accumulator, status) => {
          accumulator[status] = items.filter((task) => task.status === status);
          return accumulator;
        },
        {} as Record<TaskStatus, BoardTask[]>,
      ),
    [items],
  );

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over) {
      return;
    }

    const nextStatus = over.id as TaskStatus;
    const currentTask = items.find((task) => task.id === active.id);

    if (!currentTask || currentTask.status === nextStatus) {
      return;
    }

    const previousItems = items;
    setItems((currentItems) =>
      currentItems.map((task) => (task.id === currentTask.id ? { ...task, status: nextStatus } : task)),
    );

    startTransition(async () => {
      const result = await moveTaskAction(currentTask.id, nextStatus);

      if (!result.success) {
        setItems(previousItems);
      }

      setSuccess(result.success);
      setMessage(result.message);

      if (result.success) {
        router.refresh();
      }
    });
  }

  return (
    <Card>
      <CardHeader className="gap-3">
        <CardTitle>Kanban board</CardTitle>
        <p className="text-sm text-[var(--muted)]">Geser task ke kolom baru untuk memperbarui status.</p>
        <FormMessage success={success} message={message} />
      </CardHeader>
      <CardContent>
        <DndContext onDragEnd={handleDragEnd}>
          <div className="grid gap-4 xl:grid-cols-4">
            {taskStatuses.map((status) => (
              <BoardColumn key={status} status={status} tasks={grouped[status]} />
            ))}
          </div>
        </DndContext>
      </CardContent>
    </Card>
  );
}
