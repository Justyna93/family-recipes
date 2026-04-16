import { getAllRecipes } from "@/lib/db";
import RecipeGrid from "@/components/RecipeGrid";
import type { RecipeSummary } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let recipes: RecipeSummary[] = [];
  let categories: string[] = [];

  let dbError = "";
  try {
    recipes = await getAllRecipes();
    const catSet = new Set<string>();
    for (const r of recipes) {
      r.categories?.forEach((c) => catSet.add(c));
    }
    categories = Array.from(catSet).sort();
  } catch (err) {
    dbError = err instanceof Error ? err.message : String(err);
    console.error("[home] getAllRecipes error:", dbError);
  }

  return (
    <main className="max-w-5xl mx-auto px-4 py-6">
      {dbError ? (
        <div className="text-center py-20">
          <h2 className="text-2xl font-semibold text-red-600">Database error</h2>
          <p className="text-stone-500 mt-2 font-mono text-sm">{dbError}</p>
        </div>
      ) : recipes.length === 0 ? (
        <div className="text-center py-20">
          <h2 className="text-2xl font-semibold text-stone-700">No recipes yet</h2>
          <p className="text-stone-400 mt-2">
            Tap <span className="font-medium text-amber-600">+ Import</span> to add your first recipe
          </p>
        </div>
      ) : (
        <RecipeGrid recipes={recipes} categories={categories} />
      )}
    </main>
  );
}
