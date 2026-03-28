import { describe, expect, test } from "vitest";

import { memberTaskUpdateSchema, projectSchema, recurringTaskSchema, taskSchema } from "@/lib/validators";

describe("validators", () => {
  test("project schema rejects due date before start date", () => {
    const result = projectSchema.safeParse({
      name: "Retainer Website",
      clientName: "PT Maju Terus",
      description: "test",
      status: "ACTIVE",
      startDate: "2026-03-25",
      dueDate: "2026-03-20",
    });

    expect(result.success).toBe(false);
    expect(result.error?.flatten().fieldErrors.dueDate?.[0]).toContain("Tanggal selesai");
  });

  test("task schema accepts valid payload", () => {
    const result = taskSchema.safeParse({
      title: "Siapkan copy hero banner",
      description: "Landing page Q2",
      status: "TODO",
      priority: "HIGH",
      startDate: "2026-03-24",
      dueDate: "2026-03-28",
      projectId: "project-1",
      assigneeId: "user-1",
    });

    expect(result.success).toBe(true);
  });

  test("task schema rejects work note without work hours", () => {
    const result = taskSchema.safeParse({
      title: "Siapkan copy hero banner",
      description: "Landing page Q2",
      status: "TODO",
      priority: "HIGH",
      startDate: "2026-03-24",
      dueDate: "2026-03-28",
      projectId: "project-1",
      assigneeId: "user-1",
      workNote: "Review headline dan CTA",
    });

    expect(result.success).toBe(false);
    expect(result.error?.flatten().fieldErrors.workHours?.[0]).toContain("Jam wajib diisi");
  });

  test("member task update schema accepts valid work log", () => {
    const result = memberTaskUpdateSchema.safeParse({
      status: "IN_PROGRESS",
      description: "Sudah lanjut pengerjaan",
      workHours: "2.5",
      workNote: "Menyiapkan struktur dan revisi konten",
    });

    expect(result.success).toBe(true);
  });

  test("recurring task schema rejects end date before start date", () => {
    const result = recurringTaskSchema.safeParse({
      title: "Checklist harian leads",
      priority: "MEDIUM",
      frequency: "DAILY",
      interval: 1,
      startDate: "2026-03-25",
      endDate: "2026-03-20",
      projectId: "project-1",
      assigneeId: "user-1",
    });

    expect(result.success).toBe(false);
    expect(result.error?.flatten().fieldErrors.endDate?.[0]).toContain("Tanggal selesai");
  });
});
