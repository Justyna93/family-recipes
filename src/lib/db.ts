import { createClient } from "@supabase/supabase-js";
import type { Recipe, RecipeSummary } from "./types";

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }
  return createClient(url, key);
}

export async function getAllRecipes(): Promise<RecipeSummary[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("recipes")
    .select(
      "id, slug, title, source_url, image_url, categories, prep_time, cook_time, notes, date_added, created_at"
    )
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as RecipeSummary[];
}

export async function getRecipeBySlug(
  slug: string
): Promise<Recipe | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("recipes")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error && error.code === "PGRST116") return null;
  if (error) throw error;
  return data as Recipe;
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

export async function slugExists(slug: string): Promise<boolean> {
  const supabase = getSupabase();
  const { data } = await supabase
    .from("recipes")
    .select("id")
    .eq("slug", slug)
    .single();

  return data !== null;
}
