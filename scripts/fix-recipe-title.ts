import { createClient } from "@supabase/supabase-js";

async function main() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }

  const slug = process.argv[2] ?? "salatka-z-tunczykiem-ryzem-i-kukurydza";
  const supabase = createClient(url, key);

  const { data, error } = await supabase
    .from("recipes")
    .select("title")
    .eq("slug", slug)
    .single();

  if (error || !data) {
    console.error("Recipe not found:", slug, error?.message);
    process.exit(1);
  }

  const current = data.title as string;
  // Sentence case: lowercase everything, then capitalise the very first character
  const fixed = current.charAt(0).toUpperCase() + current.slice(1).toLowerCase();

  if (current === fixed) {
    console.log(`Title already correct: "${current}"`);
    process.exit(0);
  }

  console.log(`Updating "${current}" → "${fixed}"`);

  const { error: updateError } = await supabase
    .from("recipes")
    .update({ title: fixed })
    .eq("slug", slug);

  if (updateError) {
    console.error("Update failed:", updateError.message);
    process.exit(1);
  }

  console.log("Done.");
}

main();
