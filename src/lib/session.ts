import { notFound, redirect } from "next/navigation";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { canAccessProject, isAdminRole } from "@/lib/permissions";
import type { Role } from "@/lib/domain";

export type AppSessionUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  role: Role;
  isActive: boolean;
};

export async function getSessionUser() {
  const session = await auth();
  return (session?.user as AppSessionUser | undefined) ?? null;
}

export async function requireSessionUser() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function requireAdminSessionUser() {
  const user = await requireSessionUser();

  if (!isAdminRole(user.role)) {
    redirect("/dashboard");
  }

  return user;
}

export async function requireProjectAccess(projectId: string) {
  const user = await requireSessionUser();

  if (isAdminRole(user.role)) {
    return user;
  }

  const membership = await db.projectMember.findUnique({
    where: {
      projectId_userId: {
        projectId,
        userId: user.id,
      },
    },
  });

  if (!canAccessProject(user.role, Boolean(membership))) {
    notFound();
  }

  return user;
}
