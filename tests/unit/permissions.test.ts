import { describe, expect, test } from "vitest";

import { canAccessProject, canManageProjects, isAdminRole, projectScopeForUser } from "@/lib/permissions";

describe("permissions", () => {
  test("owner and admin are treated as admin roles", () => {
    expect(isAdminRole("OWNER")).toBe(true);
    expect(isAdminRole("ADMIN")).toBe(true);
    expect(isAdminRole("MEMBER")).toBe(false);
  });

  test("project scope for member only includes memberships", () => {
    expect(projectScopeForUser({ id: "member-1", role: "MEMBER" })).toEqual({
      members: {
        some: {
          userId: "member-1",
        },
      },
    });
  });

  test("members need membership to access project", () => {
    expect(canAccessProject("MEMBER", false)).toBe(false);
    expect(canAccessProject("MEMBER", true)).toBe(true);
    expect(canManageProjects("ADMIN")).toBe(true);
  });
});
