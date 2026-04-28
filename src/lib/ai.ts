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
- Language handling: ONLY two languages are preserved as-is: Polish and English. For literally every other language on Earth — including but not limited to French, Spanish, German, Italian, Estonian, Finnish, Hungarian, Latvian, Lithuanian, Czech, Slovak, Russian, Ukrainian, Romanian, Swedish, Norwegian, Danish, Dutch, Portuguese, Greek, Turkish, Bulgarian, Croatian, Serbian, Slovenian, and any other — you MUST translate into natural, fluent English. If the source text is not unambiguously Polish or English, translate it. When in doubt, translate.
  - For "title" and each item in "ingredients": output the English translation first, then the original-language text in brackets. Example: "Kartoffelsalat" → "Potato salad (Kartoffelsalat)"; "200 g Mehl" → "200 g flour (200 g Mehl)". Apply this to every ingredient line.
  - For "instructions", "prep_time", and "cook_time": output ONLY the English translation. Do NOT include the original-language text in brackets.
  - If the recipe is already in Polish or English, do not add any bracketed translations — leave the original text as-is.
- "categories" must only contain values from this exact list (use as many as apply, but ONLY from this list): Breakfast, Lunch, Keto, Paleo, GAPS, Baked, Salad, Sauce, Soup. Do not invent or use any other category values.
- "ingredients" is an array with one item per ingredient line, as written in the recipe.
- "instructions" is an array of ordered steps, as written in the recipe.
- "prep_time" and "cook_time" must contain ONLY a duration in hours/minutes (e.g. "30 min", "1 h 15 min", "45 minutes"). If the value is not a pure time duration, set it to null.
- If a field is not available, set it to null (or empty array for lists).
- Unit conversions (apply everywhere — ingredients AND instructions):
  - Keep the ORIGINAL non-metric value exactly as written, and add the metric equivalent in brackets immediately after. Never replace the original — always original (metric).
  - If a value is already in metric (g, kg, ml, l, cm, m, km, °C), leave it alone — do NOT add brackets.
  - Round metric equivalents sensibly (typically to the nearest 1, 5, or 10) so the result is practical for cooking, not a long decimal.
  - Temperature: Fahrenheit → Celsius. Formula: (°F − 32) × 5/9. Example: "350°F (175°C)", "400°F (200°C)".
  - Length: inches (in, ") → cm (×2.54); feet (ft, ') → cm or m (×30.48 cm); yards (yd) → m (×0.91). Examples: '1 inch (2.5 cm)', '12 inches (30 cm)', '2 feet (60 cm)'.
  - Weight: ounces (oz) → grams (×28.35); pounds (lb, lbs) → grams or kg (×453.6 g, or ×0.45 kg for large values); stones → kg (×6.35). Examples: '4 oz (115 g)', '1 lb (450 g)', '2 lbs (900 g)', '5 lbs (2.3 kg)'.
  - Volume: teaspoons (tsp) → ml (×5); tablespoons (tbsp) → ml (×15); fluid ounces (fl oz) → ml (×30); cups → ml (×240, so 1 cup ≈ 240 ml, 1/2 cup ≈ 120 ml, 1/4 cup ≈ 60 ml); pints (pt) → ml (×475); quarts (qt) → ml or l (×950 ml, or ×0.95 l); gallons (gal) → l (×3.8). Examples: '1 tsp (5 ml)', '2 tbsp (30 ml)', '1 cup (240 ml)', '1/2 cup (120 ml)', '1 pint (475 ml)', '1 quart (950 ml)', '1 gallon (3.8 l)'.
  - Keep fractions in the original unit as written (e.g. "1/2 cup", "3/4 lb") — the bracketed metric value is the rounded numeric equivalent.
  - Apply conversions to EVERY occurrence, including repeated mentions inside the same instruction step.
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

async function fetchPageText(url: string): Promise<{ text: string; ogImage: string | null }> {
  // Try direct fetch first
  const direct = await fetch(url, {
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

  if (direct.ok) {
    const html = await direct.text();
    return { text: stripHtml(html), ogImage: extractOgImage(html) };
  }

  // Fallback: use Jina Reader to bypass anti-bot protection
  const jinaRes = await fetch(`https://r.jina.ai/${url}`, {
    headers: { Accept: "text/plain" },
  });
  if (!jinaRes.ok) throw new Error(`Failed to fetch URL: ${direct.status}`);
  const text = await jinaRes.text();
  return { text, ogImage: null };
}

export async function extractFromUrl(url: string): Promise<ExtractedRecipe> {
  const { text, ogImage } = await fetchPageText(url);

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
