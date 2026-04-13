"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

export default function ImportForm() {
  const router = useRouter();
  const [tab, setTab] = useState<"url" | "image">("url");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const formData = new FormData();
      if (tab === "url") {
        if (!url.trim()) {
          setError("Please enter a URL");
          setLoading(false);
          return;
        }
        formData.append("url", url.trim());
      } else {
        if (!file) {
          setError("Please select an image");
          setLoading(false);
          return;
        }
        formData.append("file", file);
      }

      const res = await fetch("/api/import", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Import failed");
        setLoading(false);
        return;
      }

      router.push(`/recipes/${data.slug}`);
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Tabs */}
      <div className="flex rounded-xl bg-stone-100 p-1">
        <button
          type="button"
          onClick={() => setTab("url")}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
            tab === "url"
              ? "bg-white text-stone-800 shadow-sm"
              : "text-stone-500"
          }`}
        >
          From URL
        </button>
        <button
          type="button"
          onClick={() => setTab("image")}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
            tab === "image"
              ? "bg-white text-stone-800 shadow-sm"
              : "text-stone-500"
          }`}
        >
          From Screenshot
        </button>
      </div>

      {/* URL input */}
      {tab === "url" && (
        <div>
          <label htmlFor="url" className="block text-sm font-medium text-stone-700 mb-1">
            Recipe URL
          </label>
          <input
            id="url"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/recipe/..."
            className="w-full rounded-lg border border-stone-300 px-3 py-3 text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          />
        </div>
      )}

      {/* Image upload */}
      {tab === "image" && (
        <div
          className="border-2 border-dashed border-stone-300 rounded-xl p-8 text-center cursor-pointer hover:border-amber-400 transition-colors"
          onClick={() => fileRef.current?.click()}
        >
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) setFile(f);
            }}
          />
          {file ? (
            <div className="space-y-2">
              <p className="text-sm font-medium text-stone-700">{file.name}</p>
              <p className="text-xs text-stone-400">Tap to change</p>
            </div>
          ) : (
            <div className="space-y-2">
              <svg
                className="w-10 h-10 mx-auto text-stone-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <p className="text-sm text-stone-500">Tap to select a screenshot</p>
              <p className="text-xs text-stone-400">JPEG, PNG, or WebP</p>
            </div>
          )}
        </div>
      )}

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-amber-600 hover:bg-amber-700 text-white font-medium py-3 px-4 rounded-xl transition-colors disabled:opacity-50 text-base"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Claude is reading the recipe...
          </span>
        ) : (
          "Import Recipe"
        )}
      </button>
    </form>
  );
}
