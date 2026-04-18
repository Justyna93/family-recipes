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
- Preserve the original language of the recipe exactly. Do NOT translate anything — if the recipe is in Polish, French, Spanish, or any other language, keep all text in that language.
- "categories" must only contain values from this exact list (use as many as apply, but ONLY from this list): Breakfast, Lunch, Keto, Paleo, GAPS, Baked, Salad, Sauce, Soup. Do not invent or use any other category values.
- "ingredients" is an array with one item per ingredient line, as written in the recipe.
- "instructions" is an array of ordered steps, as written in the recipe.
- "prep_time" and "cook_time" must contain ONLY a duration in hours/minutes (e.g. "30 min", "1 h 15 min", "45 minutes"). If the value is not a pure time duration, set it to null.
- If a field is not available, set it to null (or empty array for lists).
- Unit conversions (apply everywhere — ingredients AND instructions):
  - Whenever a Fahrenheit temperature appears, add the Celsius equivalent in brackets immediately after: e.g. "350°F (175°C)".
  - Whenever a non-metric length appears (inches, feet, yards), add the cm/m equivalent in brackets immediately after: e.g. '1 inch (2.5 cm)', '12 inches (30 cm)'.
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

/** Extract og:image or twitter:image from raw HTML before tag-stripping */
function extractOgImage(html: string): string | null {
  const patterns = [
    /property=["']og:image["'][^>]*content=["']([^"']+)["']/i,
    /content=["']([^"']+)["'][^>]*property=["']og:image["']/i,
    /name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i,
    /content=["']([^"']+)["'][^>]*name=["']twitter:image["']/i,
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m?.[1]) return m[1];
  }
  return null;
}

function parseResponse(text: string): ExtractedRecipe {
  const cleaned = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
  return JSON.parse(cleaned);
}

export async function extractFromUrl(url: string): Promise<ExtractedRecipe> {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      "Accept":
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
      "Accept-Encoding": "gzip, deflate, br",
      "Cache-Control": "no-cache",
      "Pragma": "no-cache",
      "Sec-Fetch-Dest": "document",
      "Sec-Fetch-Mode": "navigate",
      "Sec-Fetch-Site": "none",
      "Sec-Fetch-User": "?1",
      "Upgrade-Insecure-Requests": "1",
    },
  });
  if (!res.ok) throw new Error(`Failed to fetch URL: ${res.status}`);
  const html = await res.text();
  const ogImage = extractOgImage(html);
  const text = stripHtml(html);

  const client = getClient();
  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
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
  const extracted = parseResponse(responseText);

  // Use og:image as fallback if Claude didn't extract one
  if (!extracted.image_url && ogImage) {
    extracted.image_url = ogImage;
  }

  return extracted;
}

export async function extractFromImage(
  base64: string,
  mimeType: "image/jpeg" | "image/png" | "image/webp"
): Promise<ExtractedRecipe> {
  const client = getClient();
  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
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
