export const ALLOWED_CATEGORIES = [
  "Breakfast",
  "Lunch",
  "Keto",
  "Paleo",
  "GAPS",
  "Baked",
  "Salad",
  "Sauce",
  "Soup",
] as const;

export type Category = (typeof ALLOWED_CATEGORIES)[number];

const POLISH_TO_ENGLISH: Record<string, Category> = {
  "śniadanie": "Breakfast",
  "śniadania": "Breakfast",
  "obiad": "Lunch",
  "obiady": "Lunch",
  "lunch": "Lunch",
  "kolacja": "Lunch",
  "pieczone": "Baked",
  "pieczeń": "Baked",
  "wypieki": "Baked",
  "wypiek": "Baked",
  "ciasto": "Baked",
  "ciasta": "Baked",
  "sałatka": "Salad",
  "sałatki": "Salad",
  "surówka": "Salad",
  "surówki": "Salad",
  "sos": "Sauce",
  "sosy": "Sauce",
  "zupa": "Soup",
  "zupy": "Soup",
};

export function normalizeCategory(value: string): Category | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const exact = ALLOWED_CATEGORIES.find(
    (c) => c.toLowerCase() === trimmed.toLowerCase()
  );
  if (exact) return exact;

  const polish = POLISH_TO_ENGLISH[trimmed.toLowerCase()];
  if (polish) return polish;

  return null;
}

export function normalizeCategories(values: string[] | null | undefined): Category[] {
  if (!values) return [];
  const seen = new Set<Category>();
  const result: Category[] = [];
  for (const v of values) {
    const norm = normalizeCategory(v);
    if (norm && !seen.has(norm)) {
      seen.add(norm);
      result.push(norm);
    }
  }
  return result;
}
