"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MEAL_SLOTS, SLOT_LABELS, toDateString } from "@/lib/calendar";
import type { MealSlot } from "@/lib/types";

interface AddToCalendarButtonProps {
  slug: string;
}

export default function AddToCalendarButton({ slug }: AddToCalendarButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(toDateString(new Date()));
  const [slot, setSlot] = useState<MealSlot>("dinner");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function save() {
    setError("");
    setSaving(true);
    try {
      const res = await fetch("/api/meal-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipe_slug: slug, date, slot }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to add");
        setSaving(false);
        return;
      }
      setSuccess(true);
      setSaving(false);
      router.refresh();
      setTimeout(() => {
        setOpen(false);
        setSuccess(false);
      }, 900);
    } catch {
      setError("Something went wrong");
      setSaving(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        Add to calendar
      </button>

      {open && (
        <div
          className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-4"
          onClick={() => !saving && setOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-stone-800">
              Add to calendar
            </h2>

            <div>
              <label htmlFor="date" className="block text-sm font-medium text-stone-700 mb-1">
                Date
              </label>
              <input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">
                Meal
              </label>
              <div className="flex gap-2">
                {MEAL_SLOTS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSlot(s)}
                    className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                      slot === s
                        ? "bg-amber-600 text-white"
                        : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                    }`}
                  >
                    {SLOT_LABELS[s]}
                  </button>
                ))}
              </div>
            </div>

            {error && <p className="text-red-600 text-sm">{error}</p>}
            {success && <p className="text-green-600 text-sm">Added!</p>}

            <div className="flex gap-2 pt-2">
              <button
                onClick={save}
                disabled={saving || success}
                className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
              >
                {saving ? "Saving..." : success ? "Added" : "Save"}
              </button>
              <button
                onClick={() => setOpen(false)}
                disabled={saving}
                className="px-4 py-2 text-stone-500 hover:text-stone-700 font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
