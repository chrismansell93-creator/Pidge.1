"use client";

import { useRef, useState } from "react";
import { ImagePlus, Star, Trash2 } from "lucide-react";
import { MAX_PROFILE_PHOTOS } from "@/lib/photos";

type PhotoEditorProps = {
  photos: string[];
  onChange: (photos: string[]) => void;
};

export function PhotoEditor({ photos, onChange }: PhotoEditorProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const full = photos.length >= MAX_PROFILE_PHOTOS;

  async function addUpload(file: File) {
    if (full) return;
    setBusy(true);
    setError(null);
    try {
      const body = new FormData();
      body.set("file", file);
      const res = await fetch("/api/profile/photos", { method: "POST", body });
      const json = (await res.json().catch(() => null)) as { url?: string; error?: string } | null;
      if (!res.ok || !json?.url) {
        setError(json?.error ?? "Could not upload photo");
        return;
      }
      onChange([...photos, json.url]);
    } finally {
      setBusy(false);
    }
  }

  function addUrl() {
    const next = url.trim();
    if (!next || full) return;
    if (!/^https?:\/\//.test(next) && !next.startsWith("/uploads/")) {
      setError("Use a photo URL or upload a file");
      return;
    }
    if (photos.includes(next)) {
      setError("That photo is already on your profile");
      return;
    }
    onChange([...photos, next]);
    setUrl("");
    setError(null);
  }

  function removeAt(index: number) {
    onChange(photos.filter((_, i) => i !== index));
  }

  function makeCover(index: number) {
    if (index === 0) return;
    const next = [...photos];
    const [picked] = next.splice(index, 1);
    onChange([picked, ...next]);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">
          Photos
        </label>
        <span className="text-[11px] text-zinc-500">
          {photos.length}/{MAX_PROFILE_PHOTOS}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {photos.map((src, index) => (
          <div key={src} className="relative aspect-[4/5] overflow-hidden rounded-xl bg-zinc-900">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={`Photo ${index + 1}`} className="h-full w-full object-cover" />
            <div className="absolute inset-x-0 bottom-0 flex justify-between gap-1 bg-black/60 p-1">
              <button
                type="button"
                onClick={() => makeCover(index)}
                className="rounded p-1 text-white hover:text-[#ffc800]"
                aria-label={index === 0 ? "Cover photo" : "Make cover photo"}
              >
                <Star className={`size-3.5 ${index === 0 ? "fill-[#ffc800] text-[#ffc800]" : ""}`} />
              </button>
              <button
                type="button"
                onClick={() => removeAt(index)}
                className="rounded p-1 text-white hover:text-red-400"
                aria-label="Remove photo"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
            {index === 0 ? (
              <span className="absolute top-1 left-1 rounded bg-[#ffc800] px-1 py-px text-[9px] font-black text-black">
                COVER
              </span>
            ) : null}
          </div>
        ))}

        {!full ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            className="flex aspect-[4/5] flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-white/20 bg-white/5 text-zinc-400 hover:border-[#ffc800] hover:text-[#ffc800]"
          >
            <ImagePlus className="size-5" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.12em]">
              {busy ? "Uploading" : "Upload"}
            </span>
          </button>
        ) : null}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) void addUpload(file);
        }}
      />

      <div className="flex gap-2">
        <input
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="Or paste a photo URL"
          className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white outline-none focus:border-[#ffc800]"
        />
        <button
          type="button"
          onClick={addUrl}
          disabled={full || !url.trim()}
          className="shrink-0 rounded-xl bg-white/10 px-3 text-sm font-semibold text-white disabled:opacity-40"
        >
          Add
        </button>
      </div>
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      <p className="text-[11px] text-zinc-500">
        Add up to 6 photos. The starred one is your grid cover. Tap left/right on a profile to flip through them.
      </p>
    </div>
  );
}
