"use client";

import { useEffect, useRef, useState } from "react";
import { ALLOWED_CATEGORIES } from "@/lib/categories";

interface CategoryEditorProps {
  slug: string;
  initial: string[];
}

export default function CategoryEditor({ slug, initial }: CategoryEditorProps) {
  const [selected, setSelected] = useState<string[]>(initial);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  async function persist(next: string[]) {
    setSaving(true);
    const previous = selected;
    setSelected(next);
    try {
      const res = await fetch(`/api/recipes/${slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categories: next }),
      });
      if (!res.ok) throw new Error("Failed");
    } catch {
      setSelected(previous);
    } finally {
      setSaving(false);
    }
  }

  function toggle(cat: string) {
    const next = selected.includes(cat)
      ? selected.filter((c) => c !== cat)
      : [...selected, cat];
    persist(next);
  }

  function remove(cat: string) {
    persist(selected.filter((c) => c !== cat));
  }

  const available = ALLOWED_CATEGORIES.filter((c) => !selected.includes(c));

  return (
    <div ref={containerRef} className="relative inline-flex flex-wrap items-center gap-2">
      {selected.map((cat) => (
        <span
          key={cat}
          className="inline-flex items-center gap-1 text-xs bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 pl-2.5 pr-1 py-1 rounded-full font-medium"
        >
          {cat}
          <button
            type="button"
            onClick={() => remove(cat)}
            disabled={saving}
            aria-label={`Remove ${cat}`}
            className="ml-0.5 w-4 h-4 inline-flex items-center justify-center rounded-full hover:bg-amber-200 dark:hover:bg-amber-800 disabled:opacity-50"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </span>
      ))}

      {available.length > 0 && (
        <>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            disabled={saving}
            className="text-xs px-2.5 py-1 rounded-full font-medium border border-dashed border-stone-300 dark:border-stone-600 text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 disabled:opacity-50"
          >
            + Add category
          </button>

          {open && (
            <div className="absolute top-full left-0 mt-1 z-10 min-w-[10rem] bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg shadow-lg p-1">
              {available.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    toggle(cat);
                    setOpen(false);
                  }}
                  className="block w-full text-left text-sm px-3 py-1.5 rounded hover:bg-amber-50 dark:hover:bg-amber-900/30 text-stone-700 dark:text-stone-200"
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
