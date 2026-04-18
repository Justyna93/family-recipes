"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  MEAL_SLOTS,
  SLOT_LABELS,
  addDays,
  formatDayLabel,
  isSameDay,
  toDateString,
} from "@/lib/calendar";
import type { MealPlanEntryWithRecipe, MealSlot } from "@/lib/types";

interface WeekViewProps {
  days: string[]; // YYYY-MM-DD
  anchorDate: string; // YYYY-MM-DD
  entries: MealPlanEntryWithRecipe[];
}

export default function WeekView({ days, anchorDate, entries }: WeekViewProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState<string | null>(null);

  const today = new Date();

  function shiftWeek(days: number) {
    const [y, m, d] = anchorDate.split("-").map(Number);
    const newAnchor = addDays(new Date(y, m - 1, d), days);
    router.push(`/calendar?anchor=${toDateString(newAnchor)}`);
  }

  async function remove(id: string) {
    setDeleting(id);
    try {
      await fetch(`/api/meal-plan/${id}`, { method: "DELETE" });
      router.refresh();
    } catch {
      // silently fail
    }
    setDeleting(null);
  }

  function entriesFor(dateStr: string, slot: MealSlot) {
    return entries.filter((e) => e.date === dateStr && e.slot === slot);
  }

  return (
    <div className="space-y-4">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => shiftWeek(-7)}
          className="p-2 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-400"
          aria-label="Previous week"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <button
          onClick={() => router.push("/calendar")}
          aria-label="Jump to current week"
          className="text-sm font-medium text-stone-600 dark:text-stone-400 hover:text-amber-700 dark:hover:text-amber-400 px-3 py-1 rounded-lg"
        >
          {(() => {
            const [y0, m0, d0] = days[0].split("-").map(Number);
            const [, m1, d1] = days[days.length - 1].split("-").map(Number);
            const fmt = (m: number, d: number) =>
              new Intl.DateTimeFormat("en", { month: "short" }).format(new Date(y0, m - 1, d));
            return `${d0} – ${d1} ${fmt(m1, d1)}`;
          })()}
        </button>

        <button
          onClick={() => shiftWeek(7)}
          className="p-2 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-400"
          aria-label="Next week"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Days */}
      <div className="space-y-3">
        {days.map((dateStr) => {
          const [y, m, d] = dateStr.split("-").map(Number);
          const dayDate = new Date(y, m - 1, d);
          const isToday = isSameDay(dayDate, today);

          return (
            <div
              key={dateStr}
              className={`bg-white dark:bg-stone-800 rounded-xl border ${
                isToday ? "border-amber-400 ring-1 ring-amber-400" : "border-stone-200 dark:border-stone-700"
              } overflow-hidden`}
            >
              <div
                className={`px-4 py-2 text-sm font-semibold ${
                  isToday ? "bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300" : "bg-stone-50 dark:bg-stone-700/50 text-stone-700 dark:text-stone-300"
                }`}
              >
                {formatDayLabel(dayDate)}
                {isToday && <span className="ml-2 text-xs font-normal">(today)</span>}
              </div>

              <div className="divide-y divide-stone-100 dark:divide-stone-700">
                {MEAL_SLOTS.map((slot) => {
                  const slotEntries = entriesFor(dateStr, slot);
                  return (
                    <div key={slot} className="px-4 py-2 flex items-start gap-3">
                      <span className="text-xs font-medium text-stone-400 dark:text-stone-500 uppercase tracking-wide w-16 pt-1 shrink-0">
                        {SLOT_LABELS[slot]}
                      </span>
                      <div className="flex-1 space-y-1.5 min-w-0">
                        {slotEntries.length === 0 ? (
                          <span className="text-xs text-stone-300">—</span>
                        ) : (
                          slotEntries.map((entry) => (
                            <div
                              key={entry.id}
                              className="flex items-center gap-2 group"
                            >
                              {entry.recipe?.image_url && (
                                <img
                                  src={entry.recipe.image_url}
                                  alt=""
                                  className="w-8 h-8 rounded object-cover shrink-0"
                                />
                              )}
                              <Link
                                href={`/recipes/${entry.recipe_slug}`}
                                className="flex-1 text-sm text-stone-700 dark:text-stone-300 hover:text-amber-700 dark:hover:text-amber-400 truncate"
                              >
                                {entry.recipe?.title ?? entry.recipe_slug}
                              </Link>
                              <button
                                onClick={() => remove(entry.id)}
                                disabled={deleting === entry.id}
                                className="text-stone-300 hover:text-red-500 transition-colors shrink-0 disabled:opacity-40"
                                aria-label="Remove"
                              >
                                {deleting === entry.id ? (
                                  <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                  </svg>
                                ) : (
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                )}
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
