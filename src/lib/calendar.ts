import type { MealSlot } from "./types";

export const MEAL_SLOTS: MealSlot[] = ["breakfast", "lunch", "dinner"];

export const SLOT_LABELS: Record<MealSlot, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
};

/**
 * Format a Date as YYYY-MM-DD (local time, not UTC, to avoid off-by-one errors).
 */
export function toDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Parse a YYYY-MM-DD string as a local Date (at midnight).
 */
export function fromDateString(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * The calendar view is a rolling 7-day window. Default anchor is today,
 * which yields [today - 2, today + 4]. Flipping moves the anchor by 7 days.
 */
export function getWindowStart(anchor: Date): Date {
  return addDays(anchor, -2);
}

export function getWindowDays(anchor: Date): Date[] {
  const start = getWindowStart(anchor);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

export function formatDayLabel(date: Date): string {
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
