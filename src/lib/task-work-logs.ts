import { getBusinessToday, toBusinessDay } from "@/lib/business-time";

type TaskWorkLogLike = {
  userId: string;
  hours: number;
  note: string | null;
  workDate: Date;
};

type TaskWorkLogDateLike = Pick<TaskWorkLogLike, "hours" | "workDate">;

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

export function sumTaskWorkLogsForLatestDate(workLogs: TaskWorkLogDateLike[]) {
  if (!workLogs.length) {
    return 0;
  }

  const latestTime = workLogs.reduce((latest, workLog) => {
    const workTime = toBusinessDay(workLog.workDate).getTime();
    return workTime > latest ? workTime : latest;
  }, Number.NEGATIVE_INFINITY);

  return workLogs.reduce((sum, workLog) => {
    if (toBusinessDay(workLog.workDate).getTime() !== latestTime) {
      return sum;
    }

    return sum + workLog.hours;
  }, 0);
}

export function formatLoggedHours(hours: number) {
  return Number.isInteger(hours) ? String(hours) : hours.toFixed(2).replace(/\.?0+$/, "");
}
