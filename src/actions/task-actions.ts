"use server";

import { revalidatePath } from "next/cache";

import { getBusinessToday } from "@/lib/business-time";
import { db } from "@/lib/db";
import { isAdminRole } from "@/lib/permissions";
import { requireSessionUser } from "@/lib/session";
import { errorResult, successResult, zodErrorResult } from "@/lib/action-result";
import { formDataToObject, memberTaskUpdateSchema, moveTaskSchema, taskSchema } from "@/lib/validators";
import type { TaskStatus } from "@/lib/domain";

async function canAccessProject(user: { id: string; role: "OWNER" | "ADMIN" | "MEMBER" }, projectId: string) {
  if (isAdminRole(user.role)) {
    return true;
  }

  const membership = await db.projectMember.findUnique({
    where: {
      projectId_userId: {
        projectId,
        userId: user.id,
      },
    },
  });

  return Boolean(membership);
}

async function validateAssignee(projectId: string, assigneeId?: string) {
  if (!assigneeId) {
    return {
      valid: true,
      assigneeId: null,
    };
  }

  const membership = await db.projectMember.findUnique({
    where: {
      projectId_userId: {
        projectId,
        userId: assigneeId,
      },
    },
  });

  if (!membership) {
    return {
      valid: false,
      assigneeId: null,
    };
  }

  return {
    valid: true,
    assigneeId,
  };
}

async function getProjectState(projectId: string) {
  return db.project.findUnique({
    where: {
      id: projectId,
    },
    select: {
      isArchived: true,
    },
  });
}

async function upsertTodayTaskWorkLog(taskId: string, userId: string, hours?: number, note?: string) {
  const workDate = getBusinessToday();

  if (hours === undefined) {
    await db.taskWorkLog.deleteMany({
      where: {
        taskId,
        userId,
        workDate,
      },
    });

    return;
  }

  await db.taskWorkLog.upsert({
    where: {
      taskId_userId_workDate: {
        taskId,
        userId,
        workDate,
      },
    },
    update: {
      hours,
      note: note ?? null,
    },
    create: {
      taskId,
      userId,
      workDate,
      hours,
      note: note ?? null,
    },
  });
}

export async function createTaskAction(formData: FormData) {
  const user = await requireSessionUser();
  const parsed = taskSchema.safeParse(formDataToObject(formData));

  if (!parsed.success) {
    return zodErrorResult(parsed.error);
  }

  const hasAccess = await canAccessProject(user, parsed.data.projectId);

  if (!hasAccess) {
    return errorResult("Anda tidak memiliki akses ke project ini.");
  }

  const project = await getProjectState(parsed.data.projectId);

  if (!project) {
    return errorResult("Project tidak ditemukan.");
  }

  if (project.isArchived) {
    return errorResult("Project arsip tidak bisa menerima task baru.");
  }

  const assignee = await validateAssignee(parsed.data.projectId, parsed.data.assigneeId);

  if (!assignee.valid) {
    return errorResult("Assignee harus merupakan member dari project ini.");
  }

  await db.task.create({
    data: {
      title: parsed.data.title,
      description: parsed.data.description,
      status: parsed.data.status,
      priority: parsed.data.priority,
      startDate: parsed.data.startDate,
      dueDate: parsed.data.dueDate,
      projectId: parsed.data.projectId,
      assigneeId: assignee.assigneeId,
      createdById: user.id,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/projects");
  revalidatePath(`/projects/${parsed.data.projectId}`);

  return successResult("Task baru berhasil dibuat.");
}

export async function updateTaskAction(formData: FormData) {
  const user = await requireSessionUser();
  const taskId = String(formData.get("taskId") ?? "");

  if (!taskId) {
    return errorResult("Task tidak ditemukan.");
  }

  const existingTask = await db.task.findUnique({
    where: {
      id: taskId,
    },
    select: {
      id: true,
      projectId: true,
    },
  });

  if (!existingTask) {
    return errorResult("Task tidak ditemukan.");
  }

  const hasAccess = await canAccessProject(user, existingTask.projectId);

  if (!hasAccess) {
    return errorResult("Anda tidak memiliki akses ke project ini.");
  }

  const project = await getProjectState(existingTask.projectId);

  if (!project) {
    return errorResult("Project tidak ditemukan.");
  }

  if (project.isArchived) {
    return errorResult("Project arsip tidak bisa mengubah task.");
  }

  if (!isAdminRole(user.role)) {
    const parsed = memberTaskUpdateSchema.safeParse(formDataToObject(formData));

    if (!parsed.success) {
      return zodErrorResult(parsed.error);
    }

    await db.task.update({
      where: {
        id: taskId,
      },
      data: {
        status: parsed.data.status,
        description: parsed.data.description,
      },
    });

    await upsertTodayTaskWorkLog(taskId, user.id, parsed.data.workHours, parsed.data.workNote);

    revalidatePath("/dashboard");
    revalidatePath("/projects");
    revalidatePath("/tasks");
    revalidatePath("/calendar");
    revalidatePath(`/projects/${existingTask.projectId}`);

    return successResult("Task berhasil diperbarui.");
  }

  const parsed = taskSchema.safeParse(formDataToObject(formData));

  if (!parsed.success) {
    return zodErrorResult(parsed.error);
  }

  const assignee = await validateAssignee(existingTask.projectId, parsed.data.assigneeId);

  if (!assignee.valid) {
    return errorResult("Assignee harus merupakan member dari project ini.");
  }

  await db.task.update({
    where: {
      id: taskId,
    },
    data: {
      title: parsed.data.title,
      description: parsed.data.description,
      status: parsed.data.status,
      priority: parsed.data.priority,
      startDate: parsed.data.startDate,
      dueDate: parsed.data.dueDate,
      assigneeId: assignee.assigneeId,
    },
  });

  await upsertTodayTaskWorkLog(taskId, user.id, parsed.data.workHours, parsed.data.workNote);

  revalidatePath("/dashboard");
  revalidatePath("/projects");
  revalidatePath("/tasks");
  revalidatePath("/calendar");
  revalidatePath(`/projects/${existingTask.projectId}`);

  return successResult("Task berhasil diperbarui.");
}

export async function deleteTaskAction(taskId: string) {
  const user = await requireSessionUser();

  const task = await db.task.findUnique({
    where: {
      id: taskId,
    },
    select: {
      id: true,
      projectId: true,
    },
  });

  if (!task) {
    return errorResult("Task tidak ditemukan.");
  }

  const hasAccess = await canAccessProject(user, task.projectId);

  if (!hasAccess) {
    return errorResult("Anda tidak memiliki akses ke task ini.");
  }

  if (!isAdminRole(user.role)) {
    return errorResult("Role member hanya bisa mengubah status dan deskripsi task.");
  }

  const project = await getProjectState(task.projectId);

  if (!project || project.isArchived) {
    return errorResult("Project arsip tidak bisa menghapus task.");
  }

  await db.task.delete({
    where: {
      id: task.id,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/projects");
  revalidatePath("/tasks");
  revalidatePath("/calendar");
  revalidatePath(`/projects/${task.projectId}`);

  return successResult("Task berhasil dihapus.");
}

export async function moveTaskAction(taskId: string, status: TaskStatus) {
  const user = await requireSessionUser();
  const parsed = moveTaskSchema.safeParse({ taskId, status });

  if (!parsed.success) {
    return zodErrorResult(parsed.error);
  }

  const task = await db.task.findUnique({
    where: {
      id: parsed.data.taskId,
    },
    select: {
      id: true,
      projectId: true,
    },
  });

  if (!task) {
    return errorResult("Task tidak ditemukan.");
  }

  const hasAccess = await canAccessProject(user, task.projectId);

  if (!hasAccess) {
    return errorResult("Anda tidak memiliki akses ke project ini.");
  }

  const project = await getProjectState(task.projectId);

  if (!project || project.isArchived) {
    return errorResult("Project arsip tidak bisa memindahkan status task.");
  }

  await db.task.update({
    where: {
      id: task.id,
    },
    data: {
      status: parsed.data.status,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/projects");
  revalidatePath("/tasks");
  revalidatePath("/calendar");
  revalidatePath(`/projects/${task.projectId}`);

  return successResult("Status task berhasil diperbarui.");
}
