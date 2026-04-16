import Link from "next/link";
import type { RecipeSummary } from "@/lib/types";

interface RecipeCardProps {
  recipe: RecipeSummary;
}

export default function RecipeCard({ recipe }: RecipeCardProps) {
  return (
    <Link href={`/recipes/${recipe.slug}`} className="group block">
      <div className="rounded-xl overflow-hidden shadow-sm border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 hover:shadow-md transition-shadow">
        <div className="relative h-48 w-full bg-stone-100 dark:bg-stone-700">
          {recipe.image_url ? (
            <img
              src={recipe.image_url}
              alt={recipe.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-stone-300 dark:text-stone-600">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
        </div>
        <div className="p-4">
          <h2 className="font-semibold text-stone-800 dark:text-stone-100 group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors line-clamp-2">
            {recipe.title}
          </h2>
          {recipe.categories && recipe.categories.length > 0 && (
            <div className="flex gap-1 mt-2 flex-wrap">
              {recipe.categories.map((cat) => (
                <span
                  key={cat}
                  className="text-xs bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full"
                >
                  {cat}
                </span>
              ))}
            </div>
          )}
          <div className="flex gap-3 mt-2 text-xs text-stone-400 dark:text-stone-500">
            {recipe.prep_time && <span>Prep: {recipe.prep_time}</span>}
            {recipe.cook_time && <span>Cook: {recipe.cook_time}</span>}
          </div>
        </div>
      </div>
    </Link>
  );
}
