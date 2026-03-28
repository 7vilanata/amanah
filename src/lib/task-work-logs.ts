import { getBusinessToday, toBusinessDay } from "@/lib/business-time";

type TaskWorkLogLike = {
  userId: string;
  hours: number;
  note: string | null;
  workDate: Date;
};

export function summarizeTaskWorkLogs(workLogs: TaskWorkLogLike[], userId: string, baseDate = new Date()) {
  const today = getBusinessToday(baseDate);
  const todayLog =
    workLogs.find((workLog) => workLog.userId === userId && toBusinessDay(workLog.workDate).getTime() === today.getTime()) ??
    null;

  return {
    totalHours: workLogs.reduce((sum, workLog) => sum + workLog.hours, 0),
    todayHours: todayLog?.hours ?? null,
    todayNote: todayLog?.note ?? null,
  };
}

export function formatLoggedHours(hours: number) {
  return Number.isInteger(hours) ? String(hours) : hours.toFixed(2).replace(/\.?0+$/, "");
}
