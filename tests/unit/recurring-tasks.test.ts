import { describe, expect, test } from "vitest";

import { filterOperationalTasks, recurringPatternLabel } from "@/lib/recurring-task-utils";

describe("recurring tasks", () => {
  test("filterOperationalTasks keeps manual tasks and near recurring tasks", () => {
    const filtered = filterOperationalTasks(
      [
        {
          sourceType: "MANUAL",
          occurrenceDate: null,
          status: "TODO",
        },
        {
          sourceType: "RECURRING",
          occurrenceDate: new Date("2026-03-27"),
          status: "TODO",
        },
        {
          sourceType: "RECURRING",
          occurrenceDate: new Date("2026-04-10"),
          status: "TODO",
        },
      ],
      new Date("2026-03-25"),
      7,
    );

    expect(filtered).toHaveLength(2);
  });

  test("recurringPatternLabel handles interval copy", () => {
    expect(recurringPatternLabel("DAILY", 1)).toBe("Setiap hari");
    expect(recurringPatternLabel("WEEKDAYS", 2)).toContain("2");
  });
});
