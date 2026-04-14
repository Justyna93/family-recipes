import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { addMealPlanEntry } from "@/lib/db";
import type { MealSlot } from "@/lib/types";

const VALID_SLOTS: MealSlot[] = ["breakfast", "lunch", "dinner"];

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { recipe_slug, date, slot } = body;

    if (typeof recipe_slug !== "string" || !recipe_slug) {
      return NextResponse.json({ error: "Missing recipe_slug" }, { status: 400 });
    }
    if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: "Invalid date" }, { status: 400 });
    }
    if (!VALID_SLOTS.includes(slot)) {
      return NextResponse.json({ error: "Invalid slot" }, { status: 400 });
    }

    const entry = await addMealPlanEntry(
      session.user.email,
      recipe_slug,
      date,
      slot
    );
    return NextResponse.json({ ok: true, entry });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to add";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
