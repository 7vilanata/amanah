import { describe, expect, test } from "vitest";

import { sumTaskWorkLogsForLatestDate } from "@/lib/task-work-logs";

describe("task work logs", () => {
  test("sums only the latest business-date logs for a task", () => {
    const workLogs = [
      {
        hours: 2.5,
        workDate: new Date("2026-04-10T02:00:00.000Z"),
      },
      {
        hours: 1.5,
        workDate: new Date("2026-04-10T15:30:00.000Z"),
      },
      {
        hours: 8.5,
        workDate: new Date("2026-04-11T02:00:00.000Z"),
      },
    ];

    expect(sumTaskWorkLogsForLatestDate(workLogs)).toBe(8.5);
  });

  test("groups by latest Asia/Jakarta business date consistently", () => {
    const workLogs = [
      {
        hours: 3,
        workDate: new Date("2026-04-09T20:00:00.000Z"),
      },
      {
        hours: 2,
        workDate: new Date("2026-04-10T18:00:00.000Z"),
      },
      {
        hours: 1.5,
        workDate: new Date("2026-04-10T20:00:00.000Z"),
      },
    ];

    expect(sumTaskWorkLogsForLatestDate(workLogs)).toBe(3.5);
  });
});
