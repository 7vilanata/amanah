import { describe, expect, test } from "vitest";

import {
  filterGlobalTasks,
  filterTasks,
  normalizeGlobalTaskFilters,
  normalizeProjectFilters,
  normalizeTaskFilters,
} from "@/lib/filters";

describe("filters", () => {
  test("normalize task filters falls back to safe defaults", () => {
    const filters = normalizeTaskFilters({
      status: "INVALID",
      priority: "UNKNOWN",
      tab: "random",
    });

    expect(filters.status).toBe("ALL");
    expect(filters.priority).toBe("ALL");
    expect(filters.tab).toBe("overview");
  });

  test("normalize project filters keeps valid status", () => {
    const filters = normalizeProjectFilters({
      q: "Website",
      status: "ACTIVE",
      client: "Harmoni",
    });

    expect(filters).toEqual({
      q: "Website",
      status: "ACTIVE",
      client: "Harmoni",
    });
  });

  test("filterTasks narrows by status priority and assignee", () => {
    const tasks = [
      {
        title: "Hero copy",
        description: "Landing page hero",
        status: "TODO",
        priority: "HIGH",
        assigneeId: "member-1",
        startDate: new Date("2026-03-24"),
        dueDate: new Date("2026-03-26"),
      },
      {
        title: "QA page",
        description: "Review hasil implementasi",
        status: "REVIEW",
        priority: "MEDIUM",
        assigneeId: "member-2",
        startDate: new Date("2026-03-25"),
        dueDate: new Date("2026-03-29"),
      },
    ];

    const filtered = filterTasks(tasks, {
      q: "",
      status: "TODO",
      priority: "HIGH",
      assignee: "member-1",
      month: "",
      tab: "tasks",
    });

    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.title).toBe("Hero copy");
  });

  test("global calendar filters can narrow by project", () => {
    const filters = normalizeGlobalTaskFilters({
      project: "project-2",
      status: "TODO",
    });

    const tasks = [
      {
        title: "Hero copy",
        description: "Landing page hero",
        status: "TODO",
        priority: "HIGH",
        assigneeId: "member-1",
        startDate: new Date("2026-03-24"),
        dueDate: new Date("2026-03-26"),
        projectId: "project-1",
      },
      {
        title: "QA page",
        description: "Review hasil implementasi",
        status: "TODO",
        priority: "MEDIUM",
        assigneeId: "member-2",
        startDate: new Date("2026-03-25"),
        dueDate: new Date("2026-03-29"),
        projectId: "project-2",
      },
    ];

    const filtered = filterGlobalTasks(tasks, filters);

    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.projectId).toBe("project-2");
  });
});
