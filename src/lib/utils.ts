import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

import { BUSINESS_TIME_ZONE, formatBusinessDateKey, getBusinessToday, toBusinessDay } from "@/lib/business-time";

const dateLabelFormatter = new Intl.DateTimeFormat("id-ID", {
  timeZone: BUSINESS_TIME_ZONE,
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string) {
  const value = date instanceof Date ? date : new Date(date);
  return dateLabelFormatter.format(value);
}

export function formatDateInput(date: Date | string) {
  return formatBusinessDateKey(date);
}

export function formatDateRange(startDate: Date | string, dueDate: Date | string) {
  return `${formatDate(startDate)} - ${formatDate(dueDate)}`;
}

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((segment) => segment[0]?.toUpperCase() ?? "")
    .join("");
}

export function daysBetweenToday(date: Date | string) {
  const target = toBusinessDay(date);
  const today = getBusinessToday();
  const diffMs = target.getTime() - today.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

export function isOverdue(date: Date | string) {
  return daysBetweenToday(date) < 0;
}

export function queryValue(value?: string | string[]) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}
