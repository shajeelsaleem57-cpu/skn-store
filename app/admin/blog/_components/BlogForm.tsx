"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { BlogPost } from "@prisma/client";
import { slugify } from "@/lib/utils";
import { useToast } from "../../_components/toast";
import { Card, Field, btnPrimary, btnSecondary, inputCls } from "../../_components/ui";
import { ImageInput } from "../../_components/ImageInput";

function toDateTimeLocal(v: string | Date | null | undefined): string {
  if (!v) return "";
  const d = v instanceof Date ? v : new Date(v);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function parseTags(raw: string | null): string {
  if (!raw) return "";
  try {
    const a = JSON.parse(raw) as unknown;
    return Array.isArray(a) ? a.filter((x): x is string => typeof x === "string").join(", ") : "";
  } catch {
    return "";
  }
}

export function BlogForm({ post }: { post: BlogPost | null }) {
  const router = useRouter();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [slugTouched, setSlugTouched] = useState(!!post);

  const [title, setTitle] = useState(post?.title ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "");
  const [content, setContent] = useState(post?.content ?? "");
  const [image, setImage] = useState(post?.image ?? "");
  const [category, setCategory] = useState(post?.category ?? "");
  const [tags, setTags] = useState(parseTags(post?.tags ?? null));
  const [author, setAuthor] = useState(post?.author ?? "");
  const [seoTitle, setSeoTitle] = useState(post?.seoTitle ?? "");
  const [seoDescription, setSeoDescription] = useState(post?.seoDescription ?? "");
  const [isPublished, setIsPublished] = useState(post?.isPublished ?? true);
  const [publishedAt, setPublishedAt] = useState(toDateTimeLocal(post?.publishedAt));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(post ? `/api/admin/blog/${post.id}` : "/api/admin/blog", {
        method: post ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          slug: slug.trim(),
          excerpt: excerpt.trim(),
          content,
          image: image.trim(),
          category: category.trim(),
          tags,
          author: author.trim(),
          seoTitle: seoTitle.trim(),
          seoDescription: seoDescription.trim(),
          isPublished,
          publishedAt: publishedAt || null,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Save failed");
      toast(post ? "Post updated" : "Post created");
      router.push("/admin/blog");
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
      <Card title="Post">
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
          <Field label="Slug">
            <input className={inputCls} value={slug} onChange={(e) => { setSlug(e.target.value); setSlugTouched(true); }} />
          </Field>
          <div className="md:col-span-2">
            <Field label="Excerpt">
              <textarea className={inputCls} rows={2} value={excerpt} onChange={(e) => setExcerpt(e.target.value)} />
            </Field>
          </div>
          <div className="md:col-span-2">
            <Field label="Content" hint="HTML is allowed.">
              <textarea className={`${inputCls} font-mono`} rows={12} value={content} onChange={(e) => setContent(e.target.value)} />
            </Field>
          </div>
          <div className="md:col-span-2">
            <ImageInput label="Cover image" value={image} onChange={setImage} />
          </div>
          <Field label="Category">
            <input className={inputCls} value={category} onChange={(e) => setCategory(e.target.value)} />
          </Field>
          <Field label="Tags" hint="Comma separated.">
            <input className={inputCls} value={tags} onChange={(e) => setTags(e.target.value)} placeholder="perfume, guide, tips" />
          </Field>
          <Field label="Author">
            <input className={inputCls} value={author} onChange={(e) => setAuthor(e.target.value)} />
          </Field>
          <Field label="Publish at" hint="Optional schedule.">
            <input type="datetime-local" className={inputCls} value={publishedAt} onChange={(e) => setPublishedAt(e.target.value)} />
          </Field>
          <Field label="SEO title">
            <input className={inputCls} value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} />
          </Field>
          <Field label="SEO description">
            <input className={inputCls} value={seoDescription} onChange={(e) => setSeoDescription(e.target.value)} />
          </Field>
          <div className="flex items-center gap-2 pt-6">
            <input
              id="blog-published"
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
            />
            <label htmlFor="blog-published" className="text-sm text-gray-700">Published</label>
          </div>
        </div>
      </Card>
      <div className="flex items-center gap-3">
        <button type="submit" disabled={saving} className={btnPrimary}>
          {saving ? "Saving…" : post ? "Save changes" : "Create post"}
        </button>
        <button type="button" onClick={() => router.push("/admin/blog")} className={btnSecondary}>
          Cancel
        </button>
      </div>
    </form>
  );
}
