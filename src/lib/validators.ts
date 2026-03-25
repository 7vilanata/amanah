import { z } from "zod";

import { projectStatuses, recurringTaskFrequencies, roles, taskPriorities, taskStatuses } from "@/lib/domain";

const trimmedRequired = (label: string) =>
  z.string().trim().min(1, `${label} wajib diisi.`);

const optionalTrimmed = z
  .string()
  .trim()
  .optional()
  .transform((value) => value || undefined);

const dateField = z.coerce.date({
  error: "Tanggal tidak valid.",
});

export const loginSchema = z.object({
  email: z.string().trim().email("Email tidak valid."),
  password: z.string().min(8, "Password minimal 8 karakter."),
});

export const projectSchema = z
  .object({
    name: trimmedRequired("Nama project"),
    clientName: trimmedRequired("Nama client"),
    description: optionalTrimmed,
    status: z.enum(projectStatuses),
    startDate: dateField,
    dueDate: dateField,
  })
  .refine((value) => value.dueDate >= value.startDate, {
    message: "Tanggal selesai harus sama atau setelah tanggal mulai.",
    path: ["dueDate"],
  });

export const taskSchema = z
  .object({
    title: trimmedRequired("Nama task"),
    description: optionalTrimmed,
    status: z.enum(taskStatuses),
    priority: z.enum(taskPriorities),
    startDate: dateField,
    dueDate: dateField,
    projectId: trimmedRequired("Project"),
    assigneeId: optionalTrimmed,
  })
  .refine((value) => value.dueDate >= value.startDate, {
    message: "Due date harus sama atau setelah start date.",
    path: ["dueDate"],
  });

export const memberTaskUpdateSchema = z.object({
  status: z.enum(taskStatuses),
  description: optionalTrimmed,
});

export const recurringTaskSchema = z
  .object({
    title: trimmedRequired("Nama task harian"),
    description: optionalTrimmed,
    priority: z.enum(taskPriorities),
    frequency: z.enum(recurringTaskFrequencies),
    interval: z.coerce.number().int("Interval harus berupa angka bulat.").min(1, "Interval minimal 1."),
    startDate: dateField,
    endDate: z
      .union([z.coerce.date({ error: "Tanggal tidak valid." }), z.literal(""), z.undefined()])
      .transform((value) => (value === "" || value === undefined ? undefined : value)),
    projectId: trimmedRequired("Project"),
    assigneeId: optionalTrimmed,
  })
  .refine((value) => !value.endDate || value.endDate >= value.startDate, {
    message: "Tanggal selesai harus sama atau setelah tanggal mulai.",
    path: ["endDate"],
  });

export const createUserSchema = z.object({
  name: trimmedRequired("Nama"),
  email: z.string().trim().email("Email tidak valid."),
  password: z.string().min(8, "Password minimal 8 karakter."),
  role: z.enum(roles),
});

export const updateUserSchema = z.object({
  userId: trimmedRequired("User"),
  role: z.enum(roles),
  isActive: z.enum(["true", "false"]).transform((value) => value === "true"),
});

export const membershipSchema = z.object({
  projectId: trimmedRequired("Project"),
  userId: trimmedRequired("Member"),
});

export const archiveProjectSchema = z.object({
  projectId: trimmedRequired("Project"),
  archived: z.enum(["true", "false"]).transform((value) => value === "true"),
});

export const moveTaskSchema = z.object({
  taskId: trimmedRequired("Task"),
  status: z.enum(taskStatuses),
});

export function formDataToObject(formData: FormData) {
  return Object.fromEntries(formData.entries());
}
