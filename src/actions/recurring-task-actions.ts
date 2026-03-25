"use server";

import { addDays, endOfMonth, startOfDay } from "date-fns";
import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { ensureRecurringTasksGenerated } from "@/lib/recurring-tasks";
import { isAdminRole } from "@/lib/permissions";
import { requireSessionUser } from "@/lib/session";
import { errorResult, successResult, zodErrorResult } from "@/lib/action-result";
import { formDataToObject, recurringTaskSchema } from "@/lib/validators";

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
      id: true,
      isArchived: true,
    },
  });
}

function revalidateProjectViews(projectId: string) {
  revalidatePath("/dashboard");
  revalidatePath("/projects");
  revalidatePath("/calendar");
  revalidatePath(`/projects/${projectId}`);
}

export async function createRecurringTaskAction(formData: FormData) {
  const user = await requireSessionUser();

  if (!isAdminRole(user.role)) {
    return errorResult("Role member tidak bisa membuat task harian.");
  }

  const parsed = recurringTaskSchema.safeParse(formDataToObject(formData));

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
    return errorResult("Project arsip tidak bisa menerima task harian baru.");
  }

  const assignee = await validateAssignee(parsed.data.projectId, parsed.data.assigneeId);

  if (!assignee.valid) {
    return errorResult("PIC default harus merupakan member dari project ini.");
  }

  await db.recurringTask.create({
    data: {
      ...parsed.data,
      endDate: parsed.data.endDate ?? null,
      defaultAssigneeId: assignee.assigneeId,
      createdById: user.id,
    },
  });

  await ensureRecurringTasksGenerated({
    projectIds: [parsed.data.projectId],
    fromDate: startOfDay(new Date()),
    toDate: addDays(new Date(), 7),
  });

  revalidateProjectViews(parsed.data.projectId);

  return successResult("Task harian berhasil dibuat.");
}

export async function updateRecurringTaskAction(formData: FormData) {
  const user = await requireSessionUser();
  const recurringTaskId = String(formData.get("recurringTaskId") ?? "");

  if (!isAdminRole(user.role)) {
    return errorResult("Role member tidak bisa mengubah template task harian.");
  }

  const parsed = recurringTaskSchema.safeParse(formDataToObject(formData));

  if (!recurringTaskId) {
    return errorResult("Template task harian tidak ditemukan.");
  }

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
    return errorResult("Project arsip tidak bisa mengubah task harian.");
  }

  const assignee = await validateAssignee(parsed.data.projectId, parsed.data.assigneeId);

  if (!assignee.valid) {
    return errorResult("PIC default harus merupakan member dari project ini.");
  }

  await db.recurringTask.update({
    where: {
      id: recurringTaskId,
    },
    data: {
      ...parsed.data,
      endDate: parsed.data.endDate ?? null,
      defaultAssigneeId: assignee.assigneeId,
    },
  });

  await ensureRecurringTasksGenerated({
    projectIds: [parsed.data.projectId],
    fromDate: startOfDay(new Date()),
    toDate: endOfMonth(new Date()),
  });

  revalidateProjectViews(parsed.data.projectId);

  return successResult("Task harian berhasil diperbarui.");
}

export async function toggleRecurringTaskAction(recurringTaskId: string, isActive: boolean) {
  const user = await requireSessionUser();

  if (!isAdminRole(user.role)) {
    return errorResult("Role member tidak bisa mengubah template task harian.");
  }

  const recurringTask = await db.recurringTask.findUnique({
    where: {
      id: recurringTaskId,
    },
    select: {
      id: true,
      projectId: true,
    },
  });

  if (!recurringTask) {
    return errorResult("Template task harian tidak ditemukan.");
  }

  const hasAccess = await canAccessProject(user, recurringTask.projectId);

  if (!hasAccess) {
    return errorResult("Anda tidak memiliki akses ke template ini.");
  }

  const project = await getProjectState(recurringTask.projectId);

  if (!project || project.isArchived) {
    return errorResult("Project arsip tidak bisa mengubah task harian.");
  }

  await db.recurringTask.update({
    where: {
      id: recurringTaskId,
    },
    data: {
      isActive,
    },
  });

  if (isActive) {
    await ensureRecurringTasksGenerated({
      projectIds: [recurringTask.projectId],
      fromDate: startOfDay(new Date()),
      toDate: addDays(new Date(), 7),
    });
  }

  revalidateProjectViews(recurringTask.projectId);

  return successResult(isActive ? "Task harian diaktifkan kembali." : "Task harian dijeda.");
}

export async function deleteRecurringTaskAction(recurringTaskId: string) {
  const user = await requireSessionUser();

  if (!isAdminRole(user.role)) {
    return errorResult("Role member tidak bisa menghapus template task harian.");
  }

  const recurringTask = await db.recurringTask.findUnique({
    where: {
      id: recurringTaskId,
    },
    select: {
      id: true,
      projectId: true,
    },
  });

  if (!recurringTask) {
    return errorResult("Template task harian tidak ditemukan.");
  }

  const hasAccess = await canAccessProject(user, recurringTask.projectId);

  if (!hasAccess) {
    return errorResult("Anda tidak memiliki akses ke template ini.");
  }

  const project = await getProjectState(recurringTask.projectId);

  if (!project || project.isArchived) {
    return errorResult("Project arsip tidak bisa menghapus task harian.");
  }

  await db.recurringTask.delete({
    where: {
      id: recurringTask.id,
    },
  });

  revalidateProjectViews(recurringTask.projectId);

  return successResult("Template task harian berhasil dihapus.");
}
