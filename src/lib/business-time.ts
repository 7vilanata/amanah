const BUSINESS_TIME_ZONE = "Asia/Jakarta";

const businessDayFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: BUSINESS_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

type BusinessDayParts = {
  year: number;
  month: number;
  day: number;
};

function getBusinessDayParts(date: Date | string): BusinessDayParts {
  const value = date instanceof Date ? date : new Date(date);
  const parts = businessDayFormatter.formatToParts(value);
  const year = Number(parts.find((part) => part.type === "year")?.value ?? 0);
  const month = Number(parts.find((part) => part.type === "month")?.value ?? 0);
  const day = Number(parts.find((part) => part.type === "day")?.value ?? 0);

  return {
    year,
    month,
    day,
  };
}

export function toBusinessDay(date: Date | string) {
  const { year, month, day } = getBusinessDayParts(date);

  return new Date(Date.UTC(year, month - 1, day));
}

export function getBusinessToday(baseDate = new Date()) {
  return toBusinessDay(baseDate);
}

export function formatBusinessDateKey(date: Date | string) {
  const { year, month, day } = getBusinessDayParts(date);

  return `${year.toString().padStart(4, "0")}-${month.toString().padStart(2, "0")}-${day
    .toString()
    .padStart(2, "0")}`;
}

export { BUSINESS_TIME_ZONE };
