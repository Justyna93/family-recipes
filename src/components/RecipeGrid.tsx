"use client";

import { useState, useMemo } from "react";
import Fuse from "fuse.js";
import type { RecipeSummary } from "@/lib/types";
import RecipeCard from "./RecipeCard";
import SearchBar from "./SearchBar";
import CategoryFilter from "./CategoryFilter";

interface RecipeGridProps {
  recipes: RecipeSummary[];
  categories: string[];
}

export default function RecipeGrid({ recipes, categories }: RecipeGridProps) {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const fuse = useMemo(
    () =>
      new Fuse(recipes, {
        keys: [
          { name: "title", weight: 2 },
          { name: "categories", weight: 1.5 },
          { name: "notes", weight: 1 },
        ],
        threshold: 0.35,
        minMatchCharLength: 2,
      }),
    [recipes]
  );

  const searched = query ? fuse.search(query).map((r) => r.item) : recipes;

  const filtered = activeCategory
    ? searched.filter((r) => r.categories?.includes(activeCategory))
    : searched;

  return (
    <div className="space-y-4">
      <SearchBar value={query} onChange={setQuery} />
      {categories.length > 0 && (
        <CategoryFilter
          categories={categories}
          active={activeCategory}
          onSelect={setActiveCategory}
        />
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-stone-400">
          <p className="text-lg">No recipes found</p>
          <p className="text-sm mt-1">Try a different search or category</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      )}
    </div>
  );
}
