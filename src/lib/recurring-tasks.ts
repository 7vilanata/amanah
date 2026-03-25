import "server-only";

import { addDays, isAfter, isBefore, isWeekend } from "date-fns";
import type { Prisma } from "@prisma/client";

import { getBusinessToday, toBusinessDay } from "@/lib/business-time";
import { db } from "@/lib/db";
import type { RecurringTaskFrequency } from "@/lib/domain";

type TemplateForGeneration = {
  id: string;
  title: string;
  description: string | null;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  frequency: RecurringTaskFrequency;
  interval: number;
  startDate: Date;
  endDate: Date | null;
  projectId: string;
  defaultAssigneeId: string | null;
  createdById: string;
};

function toDayKey(date: Date) {
  return toBusinessDay(date).toISOString();
}

function getFirstEligibleDate(template: TemplateForGeneration) {
  let cursor = toBusinessDay(template.startDate);

  if (template.frequency === "WEEKDAYS") {
    while (isWeekend(cursor)) {
      cursor = addDays(cursor, 1);
    }
  }

  return cursor;
}

function listOccurrences(template: TemplateForGeneration, fromDate: Date, toDate: Date) {
  const occurrences: Date[] = [];
  const rangeEnd = toBusinessDay(toDate);
  const normalizedFrom = toBusinessDay(fromDate);
  const normalizedStart = toBusinessDay(template.startDate);
  const normalizedEnd = template.endDate ? toBusinessDay(template.endDate) : null;
  let cursor = getFirstEligibleDate(template);
  let weekdayHit = 0;

  while (!isAfter(cursor, rangeEnd)) {
    const isWeekdayPattern = template.frequency === "WEEKDAYS";
    const eligible =
      !isWeekdayPattern ||
      (!isWeekend(cursor) && weekdayHit % Math.max(template.interval, 1) === 0);

    if (!isWeekdayPattern) {
      const diffDays = Math.floor((cursor.getTime() - normalizedStart.getTime()) / 86400000);

      if (diffDays >= 0 && diffDays % Math.max(template.interval, 1) === 0) {
        if (!isBefore(cursor, normalizedFrom)) {
          if (!normalizedEnd || !isAfter(cursor, normalizedEnd)) {
            occurrences.push(cursor);
          }
        }
      }
    } else if (eligible) {
      if (!isBefore(cursor, normalizedFrom)) {
        if (!normalizedEnd || !isAfter(cursor, normalizedEnd)) {
          occurrences.push(cursor);
        }
      }
    }

    if (isWeekdayPattern && !isWeekend(cursor)) {
      weekdayHit += 1;
    }

    cursor = addDays(cursor, 1);
  }

  return occurrences;
}

export async function ensureRecurringTasksGenerated({
  projectWhere,
  projectIds,
  fromDate = getBusinessToday(),
  toDate = addDays(getBusinessToday(), 7),
}: {
  projectWhere?: Prisma.ProjectWhereInput;
  projectIds?: string[];
  fromDate?: Date;
  toDate?: Date;
}) {
  const normalizedFrom = toBusinessDay(fromDate);
  const normalizedTo = toBusinessDay(toDate);

  if (isBefore(normalizedTo, normalizedFrom)) {
    return;
  }

  const templates = await db.recurringTask.findMany({
    where: {
      isActive: true,
      projectId: projectIds?.length ? { in: projectIds } : undefined,
      project: projectWhere,
    },
    select: {
      id: true,
      title: true,
      description: true,
      priority: true,
      frequency: true,
      interval: true,
      startDate: true,
      endDate: true,
      projectId: true,
      defaultAssigneeId: true,
      createdById: true,
    },
  });

  if (!templates.length) {
    return;
  }

  const templateIds = templates.map((template) => template.id);
  const existingTasks = await db.task.findMany({
    where: {
      recurringTaskId: {
        in: templateIds,
      },
      occurrenceDate: {
        gte: normalizedFrom,
        lte: normalizedTo,
      },
    },
    select: {
      recurringTaskId: true,
      occurrenceDate: true,
    },
  });

  const existingKeys = new Set(
    existingTasks
      .filter((task) => task.recurringTaskId && task.occurrenceDate)
      .map((task) => `${task.recurringTaskId}:${toDayKey(task.occurrenceDate!)}`),
  );

  const recordsToCreate = templates.flatMap((template) =>
    listOccurrences(template, normalizedFrom, normalizedTo)
      .filter((occurrenceDate) => !existingKeys.has(`${template.id}:${toDayKey(occurrenceDate)}`))
      .map((occurrenceDate) => ({
        title: template.title,
        description: template.description,
        status: "TODO" as const,
        priority: template.priority,
        sourceType: "RECURRING" as const,
        startDate: occurrenceDate,
        dueDate: occurrenceDate,
        occurrenceDate,
        projectId: template.projectId,
        assigneeId: template.defaultAssigneeId,
        recurringTaskId: template.id,
        createdById: template.createdById,
      })),
  );

  if (recordsToCreate.length) {
    await db.task.createMany({
      data: recordsToCreate,
      skipDuplicates: true,
    });
  }

  await Promise.all(
    templates.map((template) =>
      db.recurringTask.update({
        where: {
          id: template.id,
        },
        data: {
          lastGeneratedForDate: normalizedTo,
        },
      }),
    ),
  );
}
