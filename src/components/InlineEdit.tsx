"use client";

import { useState } from "react";

interface InlineEditProps {
  slug: string;
  field: "title" | "notes";
  value: string;
  as?: "h1" | "p";
  className?: string;
  placeholder?: string;
}

export default function InlineEdit({
  slug,
  field,
  value,
  as: Tag = "p",
  className = "",
  placeholder = "Click to add...",
}: InlineEditProps) {
  const [editing, setEditing] = useState(false);
  const [current, setCurrent] = useState(value);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await fetch(`/api/recipes/${slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: current }),
      });
    } catch {
      // silently fail — value stays in local state
    }
    setSaving(false);
    setEditing(false);
  }

  if (editing) {
    const isMultiline = field === "notes";
    return (
      <div className="space-y-2">
        {isMultiline ? (
          <textarea
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            rows={4}
            autoFocus
            className="w-full border border-stone-300 rounded-lg p-2 text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 resize-y"
          />
        ) : (
          <input
            type="text"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            autoFocus
            className="w-full border border-stone-300 rounded-lg p-2 text-stone-800 text-xl font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        )}
        <div className="flex gap-2">
          <button
            onClick={save}
            disabled={saving}
            className="bg-amber-600 hover:bg-amber-700 text-white text-sm px-3 py-1 rounded-lg transition-colors disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
          <button
            onClick={() => {
              setCurrent(value);
              setEditing(false);
            }}
            className="text-sm text-stone-500 hover:text-stone-700 px-3 py-1"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <Tag
      className={`${className} cursor-pointer hover:bg-amber-50 rounded px-1 -mx-1 transition-colors`}
      onClick={() => setEditing(true)}
      title="Click to edit"
    >
      {current || (
        <span className="text-stone-400 italic">{placeholder}</span>
      )}
    </Tag>
  );
}
