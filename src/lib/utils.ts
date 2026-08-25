import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMoney(amount: number | string, locale: string, currency = "ILS") {
  const value = typeof amount === "string" ? Number(amount) : amount;
  return new Intl.NumberFormat(intlTag(locale), {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatDate(date: Date | string, locale: string) {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat(intlTag(locale), {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(d);
}

export function formatDateTime(date: Date | string, locale: string) {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat(intlTag(locale), {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function formatPercent(value: number, locale: string) {
  return new Intl.NumberFormat(intlTag(locale), {
    style: "percent",
    maximumFractionDigits: 1,
  }).format(value);
}

function intlTag(locale: string) {
  switch (locale) {
    case "he":
      return "he-IL";
    case "ar":
      return "ar-IL";
    default:
      return "en-IL";
  }
}
