"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import InlineEdit from "./InlineEdit";
import ImageUpload from "./ImageUpload";
import AddToCalendarButton from "./AddToCalendarButton";

type WakeLockSentinelLike = {
  released: boolean;
  release: () => Promise<void>;
  addEventListener: (type: "release", listener: () => void) => void;
};

function useScreenWakeLock() {
  useEffect(() => {
    const nav = navigator as Navigator & {
      wakeLock?: { request: (type: "screen") => Promise<WakeLockSentinelLike> };
    };
    if (!nav.wakeLock) return;

    let sentinel: WakeLockSentinelLike | null = null;
    let cancelled = false;

    const acquire = async () => {
      try {
        const s = await nav.wakeLock!.request("screen");
        if (cancelled) {
          s.release().catch(() => {});
          return;
        }
        sentinel = s;
      } catch {
        // User gesture may be required, or the page may be hidden — ignore.
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible" && (!sentinel || sentinel.released)) {
        acquire();
      }
    };

    acquire();
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", handleVisibility);
      if (sentinel && !sentinel.released) {
        sentinel.release().catch(() => {});
      }
      sentinel = null;
    };
  }, []);
}

interface RecipeDetailProps {
  slug: string;
  title: string;
  source_url: string | null;
  image_url: string | null;
  categories: string[];
  prep_time: string | null;
  cook_time: string | null;
  notes: string | null;
  ingredientsHtml: string;
  instructionsHtml: string;
}

export default function RecipeDetail({
  slug,
  title,
  source_url,
  image_url,
  categories,
  prep_time,
  cook_time,
  notes,
  ingredientsHtml,
  instructionsHtml,
}: RecipeDetailProps) {
  const [imageUrl, setImageUrl] = useState(image_url);

  useScreenWakeLock();

  return (
    <article className="max-w-3xl mx-auto px-4 py-6">
      {/* Back link */}
      <Link
        href="/"
        className="inline-flex items-center text-sm text-stone-500 dark:text-stone-400 hover:text-amber-600 dark:hover:text-amber-400 mb-4 transition-colors"
      >
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        All Recipes
      </Link>

      {/* Hero image */}
      {imageUrl ? (
        <div className="w-full aspect-video rounded-xl overflow-hidden bg-stone-100 dark:bg-stone-800 mb-6">
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="mb-6">
          <ImageUpload slug={slug} onUploaded={setImageUrl} />
        </div>
      )}

      {/* Title */}
      <InlineEdit
        slug={slug}
        field="title"
        value={title}
        as="h1"
        className="text-2xl sm:text-3xl font-bold text-stone-800 dark:text-stone-100"
        placeholder="Add a title..."
      />

      {/* Source URL */}
      {source_url && (
        <a
          href={source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block text-sm text-amber-600 hover:text-amber-700 mt-1 break-all"
        >
          Source: {new URL(source_url).hostname}
        </a>
      )}

      {/* Add to calendar */}
      <div className="mt-4">
        <AddToCalendarButton slug={slug} />
      </div>

      {/* Meta row */}
      <div className="flex flex-wrap items-center gap-2 mt-4">
        {categories.map((cat) => (
          <span
            key={cat}
            className="text-xs bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2.5 py-1 rounded-full font-medium"
          >
            {cat}
          </span>
        ))}
        {prep_time && (
          <span className="text-sm text-stone-500">
            Prep: {prep_time}
          </span>
        )}
        {cook_time && (
          <span className="text-sm text-stone-500">
            Cook: {cook_time}
          </span>
        )}
      </div>

      {/* Notes */}
      <div className="mt-6">
        <h2 className="text-sm font-semibold text-stone-500 dark:text-stone-400 mb-1">
          Notes
        </h2>
        <InlineEdit
          slug={slug}
          field="notes"
          value={notes ?? ""}
          as="p"
          className="text-stone-600 dark:text-stone-400 text-sm leading-relaxed"
          placeholder="Click to add notes..."
        />
      </div>

      {/* Ingredients */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-100 mb-3">Ingredients</h2>
        <div
          className="prose prose-stone dark:prose-invert prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: ingredientsHtml }}
        />
      </div>

      {/* Instructions */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-100 mb-3">Instructions</h2>
        <div
          className="prose prose-stone dark:prose-invert prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: instructionsHtml }}
        />
      </div>
    </article>
  );
}
