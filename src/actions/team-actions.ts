"use server";

import { revalidatePath } from "next/cache";
import { hash } from "bcryptjs";

import { db } from "@/lib/db";
import { requireAdminSessionUser } from "@/lib/session";
import { errorResult, successResult, zodErrorResult } from "@/lib/action-result";
import { createUserSchema, formDataToObject, updateUserSchema } from "@/lib/validators";

export async function createUserAction(formData: FormData) {
  await requireAdminSessionUser();

  const parsed = createUserSchema.safeParse(formDataToObject(formData));

  if (!parsed.success) {
    return zodErrorResult(parsed.error);
  }

  const existing = await db.user.findUnique({
    where: {
      email: parsed.data.email,
    },
  });

  if (existing) {
    return errorResult("Email ini sudah digunakan.");
  }

  await db.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      role: parsed.data.role,
      passwordHash: await hash(parsed.data.password, 10),
    },
  });

  revalidatePath("/team");

  return successResult("Akun anggota tim berhasil dibuat.");
}

export async function updateUserAction(formData: FormData) {
  const currentUser = await requireAdminSessionUser();
  const parsed = updateUserSchema.safeParse(formDataToObject(formData));

  if (!parsed.success) {
    return zodErrorResult(parsed.error);
  }

  const targetUser = await db.user.findUnique({
    where: {
      id: parsed.data.userId,
    },
  });

  if (!targetUser) {
    return errorResult("User tidak ditemukan.");
  }

  if (currentUser.id === targetUser.id && !parsed.data.isActive) {
    return errorResult("Anda tidak bisa menonaktifkan akun sendiri.");
  }

  const activeOwnerCount = await db.user.count({
    where: {
      role: "OWNER",
      isActive: true,
    },
  });

  const ownerWillBeRemoved =
    targetUser.role === "OWNER" && (parsed.data.role !== "OWNER" || !parsed.data.isActive);

  if (ownerWillBeRemoved && activeOwnerCount <= 1) {
    return errorResult("Minimal harus ada satu owner aktif di sistem.");
  }

  await db.user.update({
    where: {
      id: parsed.data.userId,
    },
    data: {
      role: parsed.data.role,
      isActive: parsed.data.isActive,
    },
  });

  revalidatePath("/team");
  revalidatePath("/projects");

  return successResult("Data user berhasil diperbarui.");
}
