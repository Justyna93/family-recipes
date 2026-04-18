import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { auth } from "@/auth";
import { updateRecipe, RECIPES_TAG, recipeTag } from "@/lib/db";
import { createClient } from "@supabase/supabase-js";

function revalidateRecipe(slug: string) {
  revalidateTag(recipeTag(slug));
  revalidateTag(RECIPES_TAG);
  revalidatePath(`/recipes/${slug}`);
  revalidatePath("/");
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const patch: { title?: string; notes?: string } = {};

  if (typeof body.title === "string") patch.title = body.title.trim();
  if (typeof body.notes === "string") patch.notes = body.notes.trim();

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "No valid fields" }, { status: 400 });
  }

  try {
    await updateRecipe(params.slug, patch);
    revalidateRecipe(params.slug);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file" }, { status: 400 });
  }

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const ext = file.name.split(".").pop() || "jpg";
    const path = `recipes/${params.slug}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    await supabase.storage.from("recipe-images").upload(path, buffer, {
      contentType: file.type,
      upsert: true,
    });

    const { data } = supabase.storage
      .from("recipe-images")
      .getPublicUrl(path);

    await updateRecipe(params.slug, { image_url: data.publicUrl });
    revalidateRecipe(params.slug);

    return NextResponse.json({ image_url: data.publicUrl });
  } catch {
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
