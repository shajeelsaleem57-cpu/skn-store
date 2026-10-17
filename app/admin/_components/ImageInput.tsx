"use client";

import { useRef, useState } from "react";
import { IconImage, IconTrash, IconX } from "./icons";
import { useToast } from "./toast";
import { inputCls } from "./ui";

/**
 * Single image field: shows preview, supports file upload (via /api/admin/upload)
 * and pasting a direct URL.
 */
export function ImageInput({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (url: string) => void;
  label?: string;
}) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [urlDraft, setUrlDraft] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const upload = async (file: File) => {
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: form });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error || "Upload failed");
      onChange(data.url);
      toast("Image uploaded");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Upload failed", "error");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      {label ? <span className="mb-1 block text-sm font-medium text-gray-700">{label}</span> : null}
      <div className="flex flex-wrap items-center gap-3">
        {value ? (
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt="preview" className="h-20 w-20 rounded-md border border-gray-200 object-cover" />
            <button
              type="button"
              onClick={() => onChange("")}
              className="absolute -right-2 -top-2 rounded-full bg-red-600 p-0.5 text-white hover:bg-red-700"
              aria-label="Remove image"
            >
              <IconX className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-md border border-dashed border-gray-300 bg-gray-50 text-gray-400">
            <IconImage className="h-6 w-6" />
          </div>
        )}
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex gap-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) upload(f);
                e.target.value = "";
              }}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              {uploading ? "Uploading…" : "Upload image"}
            </button>
            {value ? (
              <button
                type="button"
                onClick={() => onChange("")}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
              >
                <IconTrash className="h-3.5 w-3.5" /> Remove
              </button>
            ) : null}
          </div>
          <div className="flex gap-2">
            <input
              className={inputCls}
              placeholder="…or paste image URL"
              value={urlDraft}
              onChange={(e) => setUrlDraft(e.target.value)}
            />
            <button
              type="button"
              onClick={() => {
                if (urlDraft.trim()) {
                  onChange(urlDraft.trim());
                  setUrlDraft("");
                }
              }}
              className="shrink-0 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              Set URL
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
