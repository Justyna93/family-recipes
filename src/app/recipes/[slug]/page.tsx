import { notFound } from "next/navigation";
import { getRecipeBySlug } from "@/lib/db";
import { markdownToHtml } from "@/lib/markdown";
import RecipeDetail from "@/components/RecipeDetail";

export const dynamic = "force-dynamic";

interface PageProps {
  params: { slug: string };
}

export default async function RecipePage({ params }: PageProps) {
  const recipe = await getRecipeBySlug(params.slug);
  if (!recipe) notFound();

  const ingredientsHtml = recipe.ingredients
    ? await markdownToHtml(recipe.ingredients)
    : "<p>No ingredients listed.</p>";

  const instructionsHtml = recipe.instructions
    ? await markdownToHtml(recipe.instructions)
    : "<p>No instructions listed.</p>";

  return (
    <RecipeDetail
      slug={recipe.slug}
      title={recipe.title}
      source_url={recipe.source_url}
      image_url={recipe.image_url}
      categories={recipe.categories ?? []}
      prep_time={recipe.prep_time}
      cook_time={recipe.cook_time}
      notes={recipe.notes}
      ingredientsHtml={ingredientsHtml}
      instructionsHtml={instructionsHtml}
    />
  );
}
