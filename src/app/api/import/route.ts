import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { auth } from "@/auth";
import { extractFromUrl, extractFromImage, findUnsplashImage } from "@/lib/ai";
import { createRecipe, slugExists, RECIPES_TAG } from "@/lib/db";
import slugify from "slugify";

function getMimeType(filename: string): "image/jpeg" | "image/png" | "image/webp" {
  const ext = filename.split(".").pop()?.toLowerCase();
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  return "image/jpeg";
}

function extFromContentType(contentType: string | null): string {
  if (!contentType) return "jpg";
  if (contentType.includes("png")) return "png";
  if (contentType.includes("webp")) return "webp";
  if (contentType.includes("gif")) return "gif";
  return "jpg";
}

// Re-host remote images so hotlink-protected origins (e.g. doradcasmaku.pl
// via Cloudflare) still render. Source page is sent as Referer so the
// origin allows the download.
async function mirrorImageToStorage(
  imageUrl: string,
  sourceUrl: string | null,
  slug: string
): Promise<string | null> {
  try {
    const headers: Record<string, string> = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
    };
    if (sourceUrl) headers["Referer"] = sourceUrl;

    const res = await fetch(imageUrl, { headers });
    if (!res.ok) return null;

    const contentType = res.headers.get("content-type");
    if (!contentType?.startsWith("image/")) return null;

    const buffer = Buffer.from(await res.arrayBuffer());
    const ext = extFromContentType(contentType);
    const path = `recipes/${slug}.${ext}`;

    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const upload = await supabase.storage
      .from("recipe-images")
      .upload(path, buffer, { contentType, upsert: true });
    if (upload.error) return null;

    return supabase.storage.from("recipe-images").getPublicUrl(path).data
      .publicUrl;
  } catch {
    return null;
  }
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

    // Mirror remote images into Supabase storage so hotlink-protected
    // hosts (Cloudflare Polish, Referer-checking origins) still render.
    if (imageUrl && sourceUrl) {
      const mirrored = await mirrorImageToStorage(imageUrl, sourceUrl, slug);
      if (mirrored) imageUrl = mirrored;
    }

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

    revalidateTag(RECIPES_TAG);
    revalidatePath("/");
    revalidatePath(`/recipes/${recipe.slug}`);

    return NextResponse.json({ slug: recipe.slug });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Import failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
