"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { isAdminRole } from "@/lib/permissions";
import { requireAdminSessionUser, requireSessionUser } from "@/lib/session";
import { errorResult, successResult, zodErrorResult } from "@/lib/action-result";
import {
  archiveProjectSchema,
  formDataToObject,
  membershipSchema,
  projectSchema,
} from "@/lib/validators";

async function ensureProjectMembership(projectId: string, userId: string) {
  return db.projectMember.findUnique({
    where: {
      projectId_userId: {
        projectId,
        userId,
      },
    },
  });
}

export async function createProjectAction(formData: FormData) {
  const user = await requireAdminSessionUser();
  const parsed = projectSchema.safeParse(formDataToObject(formData));

  if (!parsed.success) {
    return zodErrorResult(parsed.error);
  }

  const project = await db.project.create({
    data: {
      ...parsed.data,
      createdById: user.id,
      members: {
        create: {
          userId: user.id,
        },
      },
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/projects");
  revalidatePath(`/projects/${project.id}`);

  return successResult("Project baru berhasil dibuat.");
}

export async function updateProjectAction(formData: FormData) {
  await requireAdminSessionUser();

  const projectId = String(formData.get("projectId") ?? "");
  const parsed = projectSchema.safeParse(formDataToObject(formData));

  if (!projectId) {
    return errorResult("Project tidak ditemukan.");
  }

  if (!parsed.success) {
    return zodErrorResult(parsed.error);
  }

  const existingProject = await db.project.findUnique({
    where: {
      id: projectId,
    },
    select: {
      isArchived: true,
    },
  });

  if (!existingProject) {
    return errorResult("Project tidak ditemukan.");
  }

  if (existingProject.isArchived) {
    return errorResult("Project arsip harus diaktifkan kembali sebelum diubah.");
  }

  await db.project.update({
    where: {
      id: projectId,
    },
    data: parsed.data,
  });

  revalidatePath("/dashboard");
  revalidatePath("/projects");
  revalidatePath(`/projects/${projectId}`);

  return successResult("Project berhasil diperbarui.");
}

export async function toggleProjectArchiveAction(formData: FormData) {
  await requireAdminSessionUser();

  const parsed = archiveProjectSchema.safeParse(formDataToObject(formData));

  if (!parsed.success) {
    return zodErrorResult(parsed.error);
  }

  await db.project.update({
    where: {
      id: parsed.data.projectId,
    },
    data: {
      isArchived: parsed.data.archived,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/projects");
  revalidatePath(`/projects/${parsed.data.projectId}`);

  return successResult(parsed.data.archived ? "Project diarsipkan." : "Project diaktifkan kembali.");
}

export async function addProjectMemberAction(formData: FormData) {
  await requireAdminSessionUser();

  const parsed = membershipSchema.safeParse(formDataToObject(formData));

  if (!parsed.success) {
    return zodErrorResult(parsed.error);
  }

  const project = await db.project.findUnique({
    where: {
      id: parsed.data.projectId,
    },
    select: {
      isArchived: true,
    },
  });

  if (!project) {
    return errorResult("Project tidak ditemukan.");
  }

  if (project.isArchived) {
    return errorResult("Project arsip tidak bisa menerima member baru.");
  }

  const existing = await db.projectMember.findUnique({
    where: {
      projectId_userId: {
        projectId: parsed.data.projectId,
        userId: parsed.data.userId,
      },
    },
  });

  if (existing) {
    return errorResult("User ini sudah menjadi member project.");
  }

  await db.projectMember.create({
    data: parsed.data,
  });

  revalidatePath("/projects");
  revalidatePath(`/projects/${parsed.data.projectId}`);

  return successResult("Member berhasil ditambahkan ke project.");
}

export async function removeProjectMemberAction(projectId: string, userId: string) {
  const user = await requireSessionUser();

  if (!isAdminRole(user.role)) {
    return errorResult("Anda tidak memiliki izin untuk mengatur member project.");
  }

  const membership = await ensureProjectMembership(projectId, userId);

  if (!membership) {
    return errorResult("Member project tidak ditemukan.");
  }

  const project = await db.project.findUnique({
    where: {
      id: projectId,
    },
    select: {
      isArchived: true,
    },
  });

  if (!project || project.isArchived) {
    return errorResult("Project arsip tidak bisa mengubah membership.");
  }

  await db.projectMember.delete({
    where: {
      projectId_userId: {
        projectId,
        userId,
      },
    },
  });

  await db.task.updateMany({
    where: {
      projectId,
      assigneeId: userId,
    },
    data: {
      assigneeId: null,
    },
  });

  await db.recurringTask.updateMany({
    where: {
      projectId,
      defaultAssigneeId: userId,
    },
    data: {
      defaultAssigneeId: null,
    },
  });

  revalidatePath("/projects");
  revalidatePath(`/projects/${projectId}`);

  return successResult("Member berhasil dikeluarkan dari project.");
}
