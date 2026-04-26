"use client";

/**
 * ImageUpload — reusable drag-&-drop / file-picker image uploader.
 *
 * Uploads via POST /api/admin/upload (→ Cloudinary when configured,
 * local /public/uploads fallback otherwise).
 *
 * Props:
 *   value      — current URL stored in the DB (or empty string)
 *   onChange   — called with the new URL after a successful upload or paste
 *   folder     — Cloudinary sub-folder (default "nexcart/general")
 *   label      — optional field label shown above the component
 *   hint       — optional hint text shown below
 *   aspect     — "square" | "landscape" | "portrait" — controls preview shape
 *   maxSizeMB  — reject files larger than this (default 5)
 */

import { useRef, useState, useCallback } from "react";
import { Upload, X, ImageIcon, Link2, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  folder?: string;
  label?: string;
  hint?: string;
  aspect?: "square" | "landscape" | "portrait";
  maxSizeMB?: number;
  className?: string;
  disabled?: boolean;
}

const ASPECT_CLS: Record<string, string> = {
  square:    "aspect-square",
  landscape: "aspect-video",
  portrait:  "aspect-[3/4]",
};

const ALLOWED = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];

export function ImageUpload({
  value,
  onChange,
  folder = "nexcart/general",
  label,
  hint,
  aspect = "landscape",
  maxSizeMB = 5,
  className,
  disabled = false,
}: ImageUploadProps) {
  const fileRef   = useRef<HTMLInputElement>(null);
  const [uploading, setUploading]   = useState(false);
  const [dragging,  setDragging]    = useState(false);
  const [urlMode,   setUrlMode]     = useState(false);
  const [urlDraft,  setUrlDraft]    = useState("");
  const [imgBroken, setImgBroken]   = useState(false);

  // ─── Upload handler ────────────────────────────────────────────────────────
  const doUpload = useCallback(async (file: File) => {
    if (!ALLOWED.includes(file.type)) {
      toast.error("Unsupported file type. Use JPEG, PNG, WebP, or GIF.");
      return;
    }
    const limitBytes = maxSizeMB * 1024 * 1024;
    if (file.size > limitBytes) {
      toast.error(`File too large — maximum is ${maxSizeMB} MB`);
      return;
    }

    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", folder);
    try {
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      if (!res.ok) {
        const msg = await res.json().catch(() => ({}));
        throw new Error(msg?.error || "Upload failed");
      }
      const data = await res.json();
      onChange(data.url);
      setImgBroken(false);
      toast.success("Image uploaded successfully");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Image upload failed");
    } finally {
      setUploading(false);
    }
  }, [folder, maxSizeMB, onChange]);

  // ─── File input change ─────────────────────────────────────────────────────
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) doUpload(file);
    e.target.value = ""; // reset so same file can be re-selected
  }

  // ─── Drag & drop ───────────────────────────────────────────────────────────
  function onDragOver(e: React.DragEvent) {
    e.preventDefault();
    setDragging(true);
  }
  function onDragLeave() { setDragging(false); }
  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) doUpload(file);
  }

  // ─── URL paste ────────────────────────────────────────────────────────────
  function applyUrl() {
    const trimmed = urlDraft.trim();
    if (!trimmed) return;
    onChange(trimmed);
    setUrlMode(false);
    setUrlDraft("");
    setImgBroken(false);
  }

  // ─── Clear ────────────────────────────────────────────────────────────────
  function clear() { onChange(""); setImgBroken(false); }

  const hasImage  = !!value && !imgBroken;
  const aspectCls = ASPECT_CLS[aspect] ?? ASPECT_CLS.landscape;

  return (
    <div className={cn("space-y-2", className)}>
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-foreground">{label}</label>
      )}

      {/* Drop zone / preview */}
      <div
        className={cn(
          "relative w-full rounded-xl border-2 transition-colors overflow-hidden group",
          hasImage
            ? "border-border"
            : dragging
            ? "border-primary bg-primary/5"
            : "border-dashed border-border hover:border-primary/50 hover:bg-background-subtle",
          aspectCls,
          disabled && "opacity-60 pointer-events-none"
        )}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        {/* ── Preview ── */}
        {hasImage ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value}
              alt="Preview"
              className="w-full h-full object-contain bg-white"
              onError={() => setImgBroken(true)}
            />
            {/* overlay actions */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-white/90 text-foreground hover:bg-white transition-colors"
              >
                <Upload size={12} /> Replace
              </button>
              <button
                type="button"
                onClick={clear}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-white/90 text-destructive hover:bg-white transition-colors"
              >
                <X size={12} /> Remove
              </button>
            </div>
          </>
        ) : uploading ? (
          /* ── Uploading ── */
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-foreground-muted">
            <Loader2 size={28} className="animate-spin text-primary" />
            <span className="text-xs">Uploading…</span>
          </div>
        ) : (
          /* ── Empty drop zone ── */
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-foreground-muted hover:text-foreground transition-colors"
          >
            {dragging ? (
              <>
                <Upload size={28} className="text-primary" />
                <span className="text-xs font-medium text-primary">Drop to upload</span>
              </>
            ) : (
              <>
                <ImageIcon size={28} />
                <span className="text-xs">
                  <span className="font-medium text-primary">Click to upload</span>
                  {" "}or drag & drop
                </span>
                <span className="text-[10px]">JPEG · PNG · WebP · GIF — max {maxSizeMB} MB</span>
              </>
            )}
          </button>
        )}

        {/* Broken URL badge */}
        {!!value && imgBroken && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-foreground-muted bg-background-subtle">
            <ImageIcon size={28} className="opacity-30" />
            <span className="text-xs text-destructive">Image failed to load</span>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="text-xs text-primary hover:underline"
            >
              Upload a replacement
            </button>
          </div>
        )}
      </div>

      {/* URL paste row */}
      {urlMode ? (
        <div className="flex gap-2">
          <input
            type="url"
            autoFocus
            value={urlDraft}
            onChange={(e) => setUrlDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); applyUrl(); } }}
            placeholder="https://example.com/image.jpg"
            className="flex-1 px-3 py-1.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/30"
          />
          <button
            type="button"
            onClick={applyUrl}
            className="px-3 py-1.5 text-xs rounded-lg bg-primary text-primary-foreground hover:opacity-90 flex items-center gap-1"
          >
            <Check size={12} /> Apply
          </button>
          <button
            type="button"
            onClick={() => { setUrlMode(false); setUrlDraft(""); }}
            className="px-2 py-1.5 text-xs rounded-lg border border-border text-foreground-muted hover:text-foreground"
          >
            <X size={12} />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          {/* hidden file input */}
          <input
            ref={fileRef}
            type="file"
            accept={ALLOWED.join(",")}
            className="hidden"
            onChange={handleFileChange}
            disabled={disabled || uploading}
          />
          <button
            type="button"
            onClick={() => setUrlMode(true)}
            className="flex items-center gap-1.5 text-xs text-foreground-muted hover:text-foreground transition-colors"
          >
            <Link2 size={12} />
            Paste URL instead
          </button>
          {value && !imgBroken && (
            <span className="ml-auto text-[10px] text-foreground-muted truncate max-w-[200px]">
              {value.replace(/^https?:\/\//, "")}
            </span>
          )}
        </div>
      )}

      {hint && <p className="text-xs text-foreground-muted">{hint}</p>}
    </div>
  );
}
