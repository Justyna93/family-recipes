"use client";

interface CategoryFilterProps {
  categories: string[];
  active: string | null;
  onSelect: (cat: string | null) => void;
}

export default function CategoryFilter({ categories, active, onSelect }: CategoryFilterProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
      <button
        onClick={() => onSelect(null)}
        className={`shrink-0 px-3 py-1 rounded-full text-sm font-medium transition-colors ${
          active === null
            ? "bg-amber-600 text-white"
            : "bg-stone-100 text-stone-600 hover:bg-stone-200"
        }`}
      >
        All
      </button>
      {categories.map((cat) => (
        <button
          key={cat}
          onClick={() => onSelect(active === cat ? null : cat)}
          className={`shrink-0 px-3 py-1 rounded-full text-sm font-medium transition-colors ${
            active === cat
              ? "bg-amber-600 text-white"
              : "bg-stone-100 text-stone-600 hover:bg-stone-200"
          }`}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}
