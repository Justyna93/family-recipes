import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getMealPlanRange } from "@/lib/db";
import {
  fromDateString,
  getWindowDays,
  toDateString,
} from "@/lib/calendar";
import WeekView from "@/components/WeekView";
import type { MealPlanEntryWithRecipe } from "@/lib/types";

export const dynamic = "force-dynamic";

interface CalendarPageProps {
  searchParams: { anchor?: string };
}

export default async function CalendarPage({ searchParams }: CalendarPageProps) {
  const session = await auth();
  if (!session?.user?.email) {
    redirect("/login");
  }

  const anchor = searchParams.anchor
    ? fromDateString(searchParams.anchor)
    : new Date();

  const days = getWindowDays(anchor);
  const dayStrings = days.map(toDateString);
  const startDate = dayStrings[0];
  const endDate = dayStrings[dayStrings.length - 1];

  let entries: MealPlanEntryWithRecipe[] = [];
  try {
    entries = await getMealPlanRange(session.user.email, startDate, endDate);
  } catch {
    // DB not configured or table missing — show empty calendar
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-stone-800 mb-4">Meal Plan</h1>
      <WeekView
        days={dayStrings}
        anchorDate={toDateString(anchor)}
        entries={entries}
      />
    </main>
  );
}
