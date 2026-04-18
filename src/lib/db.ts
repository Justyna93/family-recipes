import { createClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";
import type {
  Recipe,
  RecipeSummary,
  MealPlanEntry,
  MealPlanEntryWithRecipe,
  MealSlot,
} from "./types";

export const RECIPES_TAG = "recipes";
export const recipeTag = (slug: string) => `recipe:${slug}`;

function getEnv() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }
  return { url, key };
}

// Default client — used by mutations and fresh reads in route handlers.
// cache: 'no-store' guarantees freshness but makes the caller dynamic.
function getSupabase() {
  const { url, key } = getEnv();
  return createClient(url, key, {
    global: {
      fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }),
    },
  });
}

// Cached client — for use inside unstable_cache. Uses Next's fetch cache
// with the same tags so revalidateTag busts both cache layers. Does NOT
// set no-store, so pages can be statically rendered / prerendered.
function getSupabaseCached(tags: string[]) {
  const { url, key } = getEnv();
  return createClient(url, key, {
    global: {
      fetch: (input, init) => fetch(input, { ...init, next: { tags } }),
    },
  });
}

export const getAllRecipes = unstable_cache(
  async (): Promise<RecipeSummary[]> => {
    const supabase = getSupabaseCached([RECIPES_TAG]);
    const { data, error } = await supabase
      .from("recipes")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data ?? []) as RecipeSummary[];
  },
  ["recipes-list"],
  { tags: [RECIPES_TAG] }
);

export async function getRecipeBySlug(
  slug: string
): Promise<Recipe | null> {
  const cached = unstable_cache(
    async (s: string): Promise<Recipe | null> => {
      const supabase = getSupabaseCached([recipeTag(s), RECIPES_TAG]);
      const { data, error } = await supabase
        .from("recipes")
        .select("*")
        .eq("slug", s)
        .single();

      if (error && error.code === "PGRST116") return null;
      if (error) throw error;
      return data as Recipe;
    },
    ["recipe-by-slug", slug],
    { tags: [recipeTag(slug), RECIPES_TAG] }
  );
  return cached(slug);
}

export async function createRecipe(
  recipe: Omit<Recipe, "id" | "created_at">
): Promise<Recipe> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("recipes")
    .insert(recipe)
    .select()
    .single();

  if (error) throw error;
  return data as Recipe;
}

export async function updateRecipe(
  slug: string,
  patch: Partial<Pick<Recipe, "title" | "notes" | "image_url" | "categories">>
): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase
    .from("recipes")
    .update(patch)
    .eq("slug", slug);

  if (error) throw error;
}

export async function getMealPlanRange(
  userEmail: string,
  startDate: string,
  endDate: string
): Promise<MealPlanEntryWithRecipe[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("meal_plan")
    .select("*, recipe:recipes(slug, title, image_url)")
    .eq("user_email", userEmail)
    .gte("date", startDate)
    .lte("date", endDate)
    .order("date", { ascending: true });

  if (error) throw error;
  return (data ?? []) as unknown as MealPlanEntryWithRecipe[];
}

export async function addMealPlanEntry(
  userEmail: string,
  recipeSlug: string,
  date: string,
  slot: MealSlot
): Promise<MealPlanEntry> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("meal_plan")
    .insert({
      user_email: userEmail,
      recipe_slug: recipeSlug,
      date,
      slot,
    })
    .select()
    .single();

  if (error) throw error;
  return data as MealPlanEntry;
}

export async function removeMealPlanEntry(
  userEmail: string,
  id: string
): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase
    .from("meal_plan")
    .delete()
    .eq("id", id)
    .eq("user_email", userEmail);

  if (error) throw error;
}

export async function slugExists(slug: string): Promise<boolean> {
  const supabase = getSupabase();
  const { data } = await supabase
    .from("recipes")
    .select("id")
    .eq("slug", slug)
    .single();

  return data !== null;
}
