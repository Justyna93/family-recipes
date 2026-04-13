import Anthropic from "@anthropic-ai/sdk";
import type { ExtractedRecipe } from "./types";

function getClient() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

const SYSTEM_PROMPT = `You are a recipe extraction assistant. Extract the recipe and return ONLY a valid JSON object with this exact shape:

{
  "title": string,
  "image_url": string | null,
  "categories": string[],
  "prep_time": string | null,
  "cook_time": string | null,
  "ingredients": string[],
  "instructions": string[]
}

Rules:
- "categories" should be 1-4 short descriptive tags inferred from the recipe content (e.g. "Italian", "Baked", "Quick", "Vegetarian", "Dessert", "Lunch", "Soup").
- "ingredients" is an array with one item per ingredient line, as written in the recipe.
- "instructions" is an array of ordered steps, as written in the recipe.
- If a field is not available, set it to null (or empty array for lists).
- Return ONLY the JSON. No markdown fences, no explanation.`;

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 50000);
}

function parseResponse(text: string): ExtractedRecipe {
  const cleaned = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
  return JSON.parse(cleaned);
}

export async function extractFromUrl(url: string): Promise<ExtractedRecipe> {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; FamilyRecipeBot/1.0)",
    },
  });
  if (!res.ok) throw new Error(`Failed to fetch URL: ${res.status}`);
  const html = await res.text();
  const text = stripHtml(html);

  const client = getClient();
  const message = await client.messages.create({
    model: "claude-sonnet-4-6-20250514",
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Extract the recipe from this web page content. The source URL is: ${url}\n\n${text}`,
      },
    ],
  });

  const responseText =
    message.content[0].type === "text" ? message.content[0].text : "";
  return parseResponse(responseText);
}

export async function extractFromImage(
  base64: string,
  mimeType: "image/jpeg" | "image/png" | "image/webp"
): Promise<ExtractedRecipe> {
  const client = getClient();
  const message = await client.messages.create({
    model: "claude-sonnet-4-6-20250514",
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: mimeType, data: base64 },
          },
          {
            type: "text",
            text: "Extract the recipe from this screenshot.",
          },
        ],
      },
    ],
  });

  const responseText =
    message.content[0].type === "text" ? message.content[0].text : "";
  return parseResponse(responseText);
}

export async function findUnsplashImage(
  query: string
): Promise<string | null> {
  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key) return null;

  try {
    const res = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query + " food")}&per_page=1&orientation=landscape`,
      { headers: { Authorization: `Client-ID ${key}` } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.results?.[0]?.urls?.regular ?? null;
  } catch {
    return null;
  }
}
