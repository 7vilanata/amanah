import { addDays, endOfWeek } from "date-fns";

import { toBusinessDay } from "@/lib/business-time";

export type TaskRange = "today" | "tomorrow" | "week" | "overdue";

export const taskRangeItems: Array<{ value: TaskRange; label: string }> = [
  { value: "today", label: "Today" },
  { value: "tomorrow", label: "Tomorrow" },
  { value: "week", label: "This week" },
  { value: "overdue", label: "Overdue" },
];

type TaskRangeRecord = {
  startDate: Date;
  dueDate: Date;
  status: "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE";
};

export function normalizeTaskRange(value: string): TaskRange {
  if (value === "tomorrow" || value === "week" || value === "overdue") {
    return value;
  }

  return "today";
}

function overlapsTimeline(task: Pick<TaskRangeRecord, "startDate" | "dueDate">, rangeStart: Date, rangeEnd: Date) {
  const taskStart = toBusinessDay(task.startDate);
  const taskEnd = toBusinessDay(task.dueDate);

  return taskStart <= rangeEnd && taskEnd >= rangeStart;
}

export function matchesTaskRange(task: TaskRangeRecord, range: TaskRange, today: Date) {
  const taskDueDate = toBusinessDay(task.dueDate);

  if (range === "overdue") {
    return task.status !== "DONE" && taskDueDate < today;
  }

  if (range === "tomorrow") {
    const tomorrow = addDays(today, 1);
    return overlapsTimeline(task, tomorrow, tomorrow);
  }

  if (range === "week") {
    return overlapsTimeline(task, today, endOfWeek(today, { weekStartsOn: 1 }));
  }

  return overlapsTimeline(task, today, today);
}
