export interface Recipe {
  id: string;
  slug: string;
  title: string;
  source_url: string | null;
  image_url: string | null;
  categories: string[];
  prep_time: string | null;
  cook_time: string | null;
  notes: string | null;
  ingredients: string | null;
  instructions: string | null;
  date_added: string | null;
  created_at: string | null;
}

export type RecipeSummary = Omit<Recipe, "ingredients" | "instructions">;

export interface ExtractedRecipe {
  title: string;
  image_url: string | null;
  categories: string[];
  prep_time: string | null;
  cook_time: string | null;
  ingredients: string[];
  instructions: string[];
}
