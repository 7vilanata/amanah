import { describe, expect, test } from "vitest";

import { getBusinessToday, toBusinessDay } from "@/lib/business-time";
import { matchesTaskRange } from "@/lib/task-range";

describe("business time", () => {
  test("maps server late-night UTC time to Jakarta today", () => {
    expect(getBusinessToday(new Date("2026-03-25T23:44:00.000Z")).toISOString()).toBe("2026-03-26T00:00:00.000Z");
  });

  test("treats 26 March task as today in Jakarta, not tomorrow", () => {
    const today = getBusinessToday(new Date("2026-03-25T23:44:00.000Z"));
    const task = {
      startDate: new Date("2026-03-26T00:00:00.000Z"),
      dueDate: new Date("2026-03-26T00:00:00.000Z"),
      status: "TODO" as const,
    };

    expect(toBusinessDay(task.dueDate).toISOString()).toBe("2026-03-26T00:00:00.000Z");
    expect(matchesTaskRange(task, "today", today)).toBe(true);
    expect(matchesTaskRange(task, "tomorrow", today)).toBe(false);
  });
});
