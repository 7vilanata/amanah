import type { Prisma } from "@prisma/client";

import type { Role } from "@/lib/domain";

export function isAdminRole(role: Role) {
  return role === "OWNER" || role === "ADMIN";
}

export function canManageProjects(role: Role) {
  return isAdminRole(role);
}

export function canManageTeam(role: Role) {
  return isAdminRole(role);
}

export function canManageProjectMembers(role: Role) {
  return isAdminRole(role);
}

export function canAccessProject(role: Role, isMember: boolean) {
  return isAdminRole(role) || isMember;
}

export function canManageTasks(role: Role, isMember: boolean) {
  return isAdminRole(role) || isMember;
}

export function projectScopeForUser(user: { id: string; role: Role }): Prisma.ProjectWhereInput {
  if (isAdminRole(user.role)) {
    return {};
  }

  return {
    members: {
      some: {
        userId: user.id,
      },
    },
  };
}

export function taskScopeForUser(user: { id: string; role: Role }): Prisma.TaskWhereInput {
  if (isAdminRole(user.role)) {
    return {};
  }

  return {
    project: {
      members: {
        some: {
          userId: user.id,
        },
      },
    },
  };
}
