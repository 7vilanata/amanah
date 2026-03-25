import { format } from "date-fns";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string) {
  return format(new Date(date), "dd MMM yyyy");
}

export function formatDateInput(date: Date | string) {
  return format(new Date(date), "yyyy-MM-dd");
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
  const target = new Date(date);
  const today = new Date();
  target.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
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
