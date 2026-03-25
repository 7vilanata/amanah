export const roles = ["OWNER", "ADMIN", "MEMBER"] as const;
export const projectStatuses = [
  "PLANNING",
  "ACTIVE",
  "ON_HOLD",
  "COMPLETED",
] as const;
export const taskStatuses = ["TODO", "IN_PROGRESS", "REVIEW", "DONE"] as const;
export const taskPriorities = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;
export const recurringTaskFrequencies = ["DAILY", "WEEKDAYS"] as const;

export type Role = (typeof roles)[number];
export type ProjectStatus = (typeof projectStatuses)[number];
export type TaskStatus = (typeof taskStatuses)[number];
export type TaskPriority = (typeof taskPriorities)[number];
export type RecurringTaskFrequency = (typeof recurringTaskFrequencies)[number];

export const roleLabels: Record<Role, string> = {
  OWNER: "Owner",
  ADMIN: "Admin",
  MEMBER: "Member",
};

export const projectStatusLabels: Record<ProjectStatus, string> = {
  PLANNING: "Planning",
  ACTIVE: "Aktif",
  ON_HOLD: "On Hold",
  COMPLETED: "Selesai",
};

export const taskStatusLabels: Record<TaskStatus, string> = {
  TODO: "To Do",
  IN_PROGRESS: "Dikerjakan",
  REVIEW: "Review",
  DONE: "Selesai",
};

export const taskPriorityLabels: Record<TaskPriority, string> = {
  LOW: "Rendah",
  MEDIUM: "Sedang",
  HIGH: "Tinggi",
  URGENT: "Urgent",
};

export const recurringTaskFrequencyLabels: Record<RecurringTaskFrequency, string> = {
  DAILY: "Setiap hari",
  WEEKDAYS: "Hari kerja",
};

export const taskStatusTone: Record<TaskStatus, "neutral" | "warning" | "accent" | "success"> = {
  TODO: "neutral",
  IN_PROGRESS: "accent",
  REVIEW: "warning",
  DONE: "success",
};

export const taskPriorityTone: Record<TaskPriority, "neutral" | "warning" | "danger" | "accent"> = {
  LOW: "neutral",
  MEDIUM: "accent",
  HIGH: "warning",
  URGENT: "danger",
};

export const projectStatusTone: Record<ProjectStatus, "neutral" | "accent" | "warning" | "success"> = {
  PLANNING: "neutral",
  ACTIVE: "accent",
  ON_HOLD: "warning",
  COMPLETED: "success",
};
