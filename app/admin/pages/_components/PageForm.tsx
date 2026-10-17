"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Page } from "@prisma/client";
import { slugify } from "@/lib/utils";
import { useToast } from "../../_components/toast";
import { Card, Field, btnPrimary, btnSecondary, inputCls } from "../../_components/ui";

export function PageForm({ page }: { page: Page | null }) {
  const router = useRouter();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [slugTouched, setSlugTouched] = useState(!!page);

  const [title, setTitle] = useState(page?.title ?? "");
  const [slug, setSlug] = useState(page?.slug ?? "");
  const [content, setContent] = useState(page?.content ?? "");
  const [seoTitle, setSeoTitle] = useState(page?.seoTitle ?? "");
  const [seoDescription, setSeoDescription] = useState(page?.seoDescription ?? "");
  const [isPublished, setIsPublished] = useState(page?.isPublished ?? true);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(page ? `/api/admin/pages/${page.id}` : "/api/admin/pages", {
        method: page ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          slug: slug.trim(),
          content,
          seoTitle: seoTitle.trim(),
          seoDescription: seoDescription.trim(),
          isPublished,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Save failed");
      toast(page ? "Page updated" : "Page created");
      router.push("/admin/pages");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
      ) : null}
      <Card title="Page">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Title *">
            <input
              className={inputCls}
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (!slugTouched) setSlug(slugify(e.target.value));
              }}
              required
            />
          </Field>
          <Field label="Slug" hint="URL path: /[slug]">
            <input className={inputCls} value={slug} onChange={(e) => { setSlug(e.target.value); setSlugTouched(true); }} />
          </Field>
          <div className="md:col-span-2">
            <Field label="Content" hint="HTML is allowed.">
              <textarea className={`${inputCls} font-mono`} rows={12} value={content} onChange={(e) => setContent(e.target.value)} />
            </Field>
          </div>
          <Field label="SEO title">
            <input className={inputCls} value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} />
          </Field>
          <Field label="SEO description">
            <input className={inputCls} value={seoDescription} onChange={(e) => setSeoDescription(e.target.value)} />
          </Field>
          <div className="flex items-center gap-2 pt-6">
            <input
              id="page-published"
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
            />
            <label htmlFor="page-published" className="text-sm text-gray-700">Published</label>
          </div>
        </div>
      </Card>
      <div className="flex items-center gap-3">
        <button type="submit" disabled={saving} className={btnPrimary}>
          {saving ? "Saving…" : page ? "Save changes" : "Create page"}
        </button>
        <button type="button" onClick={() => router.push("/admin/pages")} className={btnSecondary}>
          Cancel
        </button>
      </div>
    </form>
  );
}
