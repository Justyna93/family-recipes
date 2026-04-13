import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { extractFromUrl, extractFromImage, findUnsplashImage } from "@/lib/ai";
import { createRecipe, slugExists } from "@/lib/db";
import slugify from "slugify";

function getMimeType(filename: string): "image/jpeg" | "image/png" | "image/webp" {
  const ext = filename.split(".").pop()?.toLowerCase();
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  return "image/jpeg";
}

async function uniqueSlug(base: string): Promise<string> {
  let slug = slugify(base, { lower: true, strict: true });
  if (!slug) slug = "recipe";

  let candidate = slug;
  let counter = 2;
  while (await slugExists(candidate)) {
    candidate = `${slug}-${counter}`;
    counter++;
  }
  return candidate;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const url = formData.get("url") as string | null;
    const file = formData.get("file") as File | null;

    if (!url && !file) {
      return NextResponse.json(
        { error: "Provide a URL or upload a screenshot" },
        { status: 400 }
      );
    }

    let extracted;
    let sourceUrl: string | null = null;

    if (url) {
      sourceUrl = url;
      extracted = await extractFromUrl(url);
    } else if (file) {
      const buffer = await file.arrayBuffer();
      const base64 = Buffer.from(buffer).toString("base64");
      const mimeType = getMimeType(file.name);
      extracted = await extractFromImage(base64, mimeType);
    } else {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    // For screenshot imports without an image, try Unsplash
    let imageUrl = extracted.image_url;
    if (!imageUrl && !url) {
      imageUrl = await findUnsplashImage(extracted.title);
    }

    const slug = await uniqueSlug(extracted.title);

    const recipe = await createRecipe({
      slug,
      title: extracted.title,
      source_url: sourceUrl,
      image_url: imageUrl,
      categories: extracted.categories,
      prep_time: extracted.prep_time,
      cook_time: extracted.cook_time,
      notes: null,
      ingredients: extracted.ingredients.map((i) => `- ${i}`).join("\n"),
      instructions: extracted.instructions
        .map((s, i) => `${i + 1}. ${s}`)
        .join("\n"),
      date_added: new Date().toISOString().split("T")[0],
    });

    return NextResponse.json({ slug: recipe.slug });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Import failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
