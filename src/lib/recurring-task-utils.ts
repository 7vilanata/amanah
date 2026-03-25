import { addDays } from "date-fns";
import type { Task } from "@prisma/client";

import { getBusinessToday, toBusinessDay } from "@/lib/business-time";
import { recurringTaskFrequencyLabels, type RecurringTaskFrequency } from "@/lib/domain";

const DEFAULT_OPERATIONAL_WINDOW_DAYS = 7;

export function filterOperationalTasks<
  T extends Pick<Task, "sourceType" | "occurrenceDate" | "status">,
>(tasks: T[], baseDate = new Date(), horizonDays = DEFAULT_OPERATIONAL_WINDOW_DAYS) {
  const today = getBusinessToday(baseDate);
  const horizon = addDays(today, horizonDays);

  return tasks.filter((task) => {
    if (task.sourceType !== "RECURRING" || !task.occurrenceDate) {
      return true;
    }

    const occurrence = toBusinessDay(task.occurrenceDate);

    if (occurrence >= today && occurrence <= horizon) {
      return true;
    }

    return occurrence < today && task.status !== "DONE";
  });
}

export function recurringPatternLabel(frequency: RecurringTaskFrequency, interval: number) {
  if (interval <= 1) {
    return recurringTaskFrequencyLabels[frequency];
  }

  return frequency === "DAILY" ? `Setiap ${interval} hari` : `Setiap ${interval} hari kerja`;
}
