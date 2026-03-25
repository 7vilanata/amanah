import type { Project, Task } from "@prisma/client";

import {
  projectStatuses,
  taskPriorities,
  taskStatuses,
  type ProjectStatus,
  type TaskPriority,
  type TaskStatus,
} from "@/lib/domain";
import { queryValue } from "@/lib/utils";

export type ProjectFilters = {
  q: string;
  status: ProjectStatus | "ALL";
  client: string;
};

export type TaskFilters = {
  q: string;
  status: TaskStatus | "ALL";
  priority: TaskPriority | "ALL";
  assignee: string;
  month: string;
  tab: "overview" | "tasks" | "board" | "calendar" | "members";
};

export type GlobalTaskFilters = Omit<TaskFilters, "tab"> & {
  project: string;
};

export function normalizeProjectFilters(searchParams: Record<string, string | string[] | undefined>): ProjectFilters {
  const rawStatus = queryValue(searchParams.status);

  return {
    q: queryValue(searchParams.q),
    status: projectStatuses.includes(rawStatus as ProjectStatus) ? (rawStatus as ProjectStatus) : "ALL",
    client: queryValue(searchParams.client),
  };
}

export function normalizeTaskFilters(searchParams: Record<string, string | string[] | undefined>): TaskFilters {
  const rawStatus = queryValue(searchParams.status);
  const rawPriority = queryValue(searchParams.priority);
  const rawTab = queryValue(searchParams.tab);

  return {
    q: queryValue(searchParams.q),
    status: taskStatuses.includes(rawStatus as TaskStatus) ? (rawStatus as TaskStatus) : "ALL",
    priority: taskPriorities.includes(rawPriority as TaskPriority) ? (rawPriority as TaskPriority) : "ALL",
    assignee: queryValue(searchParams.assignee),
    month: queryValue(searchParams.month),
    tab: ["overview", "tasks", "board", "calendar", "members"].includes(rawTab)
      ? (rawTab as TaskFilters["tab"])
      : "overview",
  };
}

export function normalizeGlobalTaskFilters(
  searchParams: Record<string, string | string[] | undefined>,
): GlobalTaskFilters {
  const rawStatus = queryValue(searchParams.status);
  const rawPriority = queryValue(searchParams.priority);

  return {
    q: queryValue(searchParams.q),
    status: taskStatuses.includes(rawStatus as TaskStatus) ? (rawStatus as TaskStatus) : "ALL",
    priority: taskPriorities.includes(rawPriority as TaskPriority) ? (rawPriority as TaskPriority) : "ALL",
    assignee: queryValue(searchParams.assignee),
    month: queryValue(searchParams.month),
    project: queryValue(searchParams.project),
  };
}

export function filterProjects<T extends Pick<Project, "name" | "clientName" | "status">>(
  projects: T[],
  filters: ProjectFilters,
) {
  return projects.filter((project) => {
    const matchesQuery =
      !filters.q ||
      project.name.toLowerCase().includes(filters.q.toLowerCase()) ||
      project.clientName.toLowerCase().includes(filters.q.toLowerCase());
    const matchesStatus = filters.status === "ALL" || project.status === filters.status;
    const matchesClient =
      !filters.client || project.clientName.toLowerCase().includes(filters.client.toLowerCase());

    return matchesQuery && matchesStatus && matchesClient;
  });
}

export function filterTasks<
  T extends Pick<Task, "title" | "description" | "status" | "priority" | "assigneeId" | "startDate" | "dueDate">,
>(
  tasks: T[],
  filters: TaskFilters,
) {
  return tasks.filter((task) => {
    const matchesQuery =
      !filters.q ||
      task.title.toLowerCase().includes(filters.q.toLowerCase()) ||
      task.description?.toLowerCase().includes(filters.q.toLowerCase());
    const matchesStatus = filters.status === "ALL" || task.status === filters.status;
    const matchesPriority = filters.priority === "ALL" || task.priority === filters.priority;
    const matchesAssignee = !filters.assignee || task.assigneeId === filters.assignee;
    const matchesMonth =
      !filters.month ||
      task.startDate.toISOString().startsWith(filters.month) ||
      task.dueDate.toISOString().startsWith(filters.month);

    return matchesQuery && matchesStatus && matchesPriority && matchesAssignee && matchesMonth;
  });
}

export function filterGlobalTasks<
  T extends Pick<
    Task,
    "title" | "description" | "status" | "priority" | "assigneeId" | "startDate" | "dueDate" | "projectId"
  >,
>(
  tasks: T[],
  filters: GlobalTaskFilters,
) {
  return filterTasks(tasks, {
    ...filters,
    tab: "calendar",
  }).filter((task) => !filters.project || task.projectId === filters.project);
}
