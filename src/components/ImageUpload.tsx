"use client";

import { useState, useRef } from "react";

interface ImageUploadProps {
  slug: string;
  onUploaded: (url: string) => void;
}

export default function ImageUpload({ slug, onUploaded }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("slug", slug);

      const res = await fetch(`/api/recipes/${slug}`, {
        method: "PUT",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        onUploaded(data.image_url);
      }
    } catch {
      // silently fail
    }
    setUploading(false);
  }

  return (
    <div
      className="w-full h-48 sm:h-64 bg-stone-100 rounded-xl border-2 border-dashed border-stone-300 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-amber-400 transition-colors"
      onClick={() => fileRef.current?.click()}
    >
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
      {uploading ? (
        <p className="text-sm text-stone-500">Uploading...</p>
      ) : (
        <>
          <svg className="w-8 h-8 text-stone-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
          </svg>
          <p className="text-sm text-stone-400">Tap to upload a photo</p>
        </>
      )}
    </div>
  );
}
