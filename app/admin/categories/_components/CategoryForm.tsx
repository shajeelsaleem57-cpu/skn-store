"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Category } from "@prisma/client";
import { slugify } from "@/lib/utils";
import { useToast } from "../../_components/toast";
import { Card, Field, btnPrimary, btnSecondary, inputCls } from "../../_components/ui";
import { ImageInput } from "../../_components/ImageInput";

export function CategoryForm({
  category,
  categories,
}: {
  category: Category | null;
  categories: { id: string; name: string; parentId: string | null }[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [slugTouched, setSlugTouched] = useState(!!category);

  // ids that cannot be chosen as parent: self + all descendants
  const forbidden = new Set<string>();
  if (category) {
    forbidden.add(category.id);
    const byParent = new Map<string, string[]>();
    for (const c of categories) {
      if (c.parentId) {
        const list = byParent.get(c.parentId) ?? [];
        list.push(c.id);
        byParent.set(c.parentId, list);
      }
    }
    const stack = [...(byParent.get(category.id) ?? [])];
    while (stack.length) {
      const id = stack.pop()!;
      forbidden.add(id);
      stack.push(...(byParent.get(id) ?? []));
    }
  }

  const [name, setName] = useState(category?.name ?? "");
  const [slug, setSlug] = useState(category?.slug ?? "");
  const [description, setDescription] = useState(category?.description ?? "");
  const [image, setImage] = useState(category?.image ?? "");
  const [icon, setIcon] = useState(category?.icon ?? "");
  const [parentId, setParentId] = useState(category?.parentId ?? "");
  const [sortOrder, setSortOrder] = useState(category ? String(category.sortOrder) : "0");
  const [isVisible, setIsVisible] = useState(category?.isVisible ?? true);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name.trim()) {
      setError("Name is required.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(category ? `/api/admin/categories/${category.id}` : "/api/admin/categories", {
        method: category ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim(),
          description: description.trim(),
          image: image.trim(),
          icon: icon.trim(),
          parentId: parentId || null,
          sortOrder: parseInt(sortOrder || "0", 10) || 0,
          isVisible,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Save failed");
      toast(category ? "Category updated" : "Category created");
      router.push("/admin/categories");
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
      <Card title="Category details">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Name *">
            <input
              className={inputCls}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!slugTouched) setSlug(slugify(e.target.value));
              }}
              required
            />
          </Field>
          <Field label="Slug">
            <input className={inputCls} value={slug} onChange={(e) => { setSlug(e.target.value); setSlugTouched(true); }} />
          </Field>
          <div className="md:col-span-2">
            <Field label="Description">
              <textarea className={inputCls} rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
            </Field>
          </div>
          <div className="md:col-span-2">
            <ImageInput label="Image" value={image} onChange={setImage} />
          </div>
          <Field label="Icon" hint="Short text or emoji shown next to the name (optional).">
            <input className={inputCls} value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="e.g. ◆" />
          </Field>
          <Field label="Parent category">
            <select className={inputCls} value={parentId} onChange={(e) => setParentId(e.target.value)}>
              <option value="">None (top-level)</option>
              {categories
                .filter((c) => !forbidden.has(c.id))
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </select>
          </Field>
          <Field label="Sort order" hint="Lower numbers appear first.">
            <input className={inputCls} inputMode="numeric" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} />
          </Field>
          <div className="flex items-center gap-2 pt-6">
            <input
              id="cat-visible"
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
              checked={isVisible}
              onChange={(e) => setIsVisible(e.target.checked)}
            />
            <label htmlFor="cat-visible" className="text-sm text-gray-700">Visible in store</label>
          </div>
        </div>
      </Card>
      <div className="flex items-center gap-3">
        <button type="submit" disabled={saving} className={btnPrimary}>
          {saving ? "Saving…" : category ? "Save changes" : "Create category"}
        </button>
        <button type="button" onClick={() => router.push("/admin/categories")} className={btnSecondary}>
          Cancel
        </button>
      </div>
    </form>
  );
}
