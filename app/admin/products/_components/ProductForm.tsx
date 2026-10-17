"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import type { Product, ProductVariant } from "@prisma/client";
import { slugify } from "@/lib/utils";
import { useToast } from "../../_components/toast";
import { Card, Field, btnPrimary, btnSecondary, inputCls } from "../../_components/ui";
import { IconImage, IconPlus, IconTrash, IconX } from "../../_components/icons";
import { cn } from "@/lib/utils";

export type ProductWithVariants = Product & { variants: ProductVariant[] };
export type CategoryOption = { id: string; name: string; parentName: string | null };

function toDateTimeLocal(v: string | Date | null | undefined): string {
  if (!v) return "";
  const d = v instanceof Date ? v : new Date(v);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

type SpecRow = { key: string; value: string };
type VariantRow = { name: string; value: string; priceAdjust: string; stock: string; sku: string };

export function ProductForm({
  product,
  categories,
}: {
  product: ProductWithVariants | null;
  categories: CategoryOption[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [slugTouched, setSlugTouched] = useState(!!product);
  const fileRef = useRef<HTMLInputElement>(null);
  const [urlDraft, setUrlDraft] = useState("");

  const specsInit: SpecRow[] = (() => {
    try {
      const obj = JSON.parse(product?.specifications || "{}") as Record<string, string>;
      const rows = Object.entries(obj).map(([key, value]) => ({ key, value: String(value) }));
      return rows.length ? rows : [{ key: "", value: "" }];
    } catch {
      return [{ key: "", value: "" }];
    }
  })();

  const [title, setTitle] = useState(product?.title ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [sku, setSku] = useState(product?.sku ?? "");
  const [price, setPrice] = useState(product ? String(product.price) : "");
  const [salePrice, setSalePrice] = useState(product?.salePrice != null ? String(product.salePrice) : "");
  const [stock, setStock] = useState(product ? String(product.stock) : "0");
  const [lowStockThreshold, setLowStockThreshold] = useState(product ? String(product.lowStockThreshold) : "5");
  const [images, setImages] = useState<string[]>(() => {
    try {
      const a = JSON.parse(product?.images || "[]") as unknown;
      return Array.isArray(a) ? a.filter((x): x is string => typeof x === "string") : [];
    } catch {
      return [];
    }
  });
  const [categoryId, setCategoryId] = useState(product?.categoryId ?? "");
  const [isPublished, setIsPublished] = useState(product?.isPublished ?? true);
  const [isFeatured, setIsFeatured] = useState(product?.isFeatured ?? false);
  const [isBestSeller, setIsBestSeller] = useState(product?.isBestSeller ?? false);
  const [publishedAt, setPublishedAt] = useState(toDateTimeLocal(product?.publishedAt));
  const [shortDescription, setShortDescription] = useState(product?.shortDescription ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [specRows, setSpecRows] = useState<SpecRow[]>(specsInit);
  const [variantRows, setVariantRows] = useState<VariantRow[]>(
    product?.variants.length
      ? product.variants.map((v) => ({
          name: v.name,
          value: v.value,
          priceAdjust: String(v.priceAdjust),
          stock: v.stock != null ? String(v.stock) : "",
          sku: v.sku ?? "",
        }))
      : [{ name: "", value: "", priceAdjust: "0", stock: "", sku: "" }]
  );
  const [seoTitle, setSeoTitle] = useState(product?.seoTitle ?? "");
  const [seoDescription, setSeoDescription] = useState(product?.seoDescription ?? "");
  const [seoKeywords, setSeoKeywords] = useState(product?.seoKeywords ?? "");

  const uploadFiles = async (files: FileList | File[]) => {
    const list = Array.from(files);
    if (!list.length) return;
    setUploading(true);
    try {
      for (const file of list) {
        const form = new FormData();
        form.append("file", file);
        const res = await fetch("/api/admin/upload", { method: "POST", body: form });
        const data = (await res.json()) as { url?: string; error?: string };
        if (!res.ok || !data.url) throw new Error(data.error || `Upload failed for ${file.name}`);
        setImages((prev) => [...prev, data.url as string]);
      }
      toast("Images uploaded");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Upload failed", "error");
    } finally {
      setUploading(false);
    }
  };

  const moveImage = (i: number, dir: -1 | 1) => {
    setImages((prev) => {
      const j = i + dir;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    const priceNum = parseInt(price, 10);
    if (!Number.isFinite(priceNum) || priceNum < 0) {
      setError("Price must be a non-negative whole number.");
      return;
    }
    const specifications: Record<string, string> = {};
    for (const r of specRows) {
      if (r.key.trim()) specifications[r.key.trim()] = r.value.trim();
    }
    const variants = variantRows
      .filter((r) => r.value.trim() !== "")
      .map((r) => ({
        name: r.name.trim() || "Option",
        value: r.value.trim(),
        priceAdjust: parseInt(r.priceAdjust || "0", 10) || 0,
        stock: r.stock.trim() === "" ? null : parseInt(r.stock, 10),
        sku: r.sku.trim() || null,
      }));

    const payload = {
      title: title.trim(),
      slug: slug.trim(),
      sku: sku.trim(),
      price: priceNum,
      salePrice: salePrice.trim() === "" ? null : parseInt(salePrice, 10),
      stock: parseInt(stock || "0", 10) || 0,
      lowStockThreshold: parseInt(lowStockThreshold || "5", 10),
      images,
      categoryId: categoryId || null,
      isPublished,
      isFeatured,
      isBestSeller,
      publishedAt: publishedAt || null,
      shortDescription: shortDescription.trim(),
      description: description.trim(),
      specifications,
      variants,
      seoTitle: seoTitle.trim(),
      seoDescription: seoDescription.trim(),
      seoKeywords: seoKeywords.trim(),
    };

    setSaving(true);
    try {
      const res = await fetch(product ? `/api/admin/products/${product.id}` : "/api/admin/products", {
        method: product ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Save failed");
      toast(product ? "Product updated" : "Product created");
      router.push("/admin/products");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const checkboxCls = "h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900";

  return (
    <form onSubmit={submit} className="space-y-4">
      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
      ) : null}

      <Card title="Basic information">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Title *">
            <input
              className={inputCls}
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (!slugTouched) setSlug(slugify(e.target.value));
              }}
              placeholder="e.g. ÉCLAT NOIR — Eau de Parfum"
              required
            />
          </Field>
          <Field label="Slug" hint="Auto-generated from the title; you can edit it.">
            <input className={inputCls} value={slug} onChange={(e) => { setSlug(e.target.value); setSlugTouched(true); }} />
          </Field>
          <Field label="SKU">
            <input className={inputCls} value={sku} onChange={(e) => setSku(e.target.value)} placeholder="Optional stock-keeping unit" />
          </Field>
          <Field label="Category">
            <select className={inputCls} value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">Uncategorized</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.parentName ? `${c.parentName} › ${c.name}` : c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Short description">
            <textarea className={inputCls} rows={2} value={shortDescription} onChange={(e) => setShortDescription(e.target.value)} />
          </Field>
          <div className="flex flex-wrap items-center gap-5 pt-6">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" className={checkboxCls} checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} />
              Published
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" className={checkboxCls} checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} />
              Featured
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" className={checkboxCls} checked={isBestSeller} onChange={(e) => setIsBestSeller(e.target.checked)} />
              Best seller
            </label>
          </div>
        </div>
      </Card>

      <Card title="Pricing & inventory">
        <div className="grid gap-4 md:grid-cols-4">
          <Field label="Price (Rs) *">
            <input className={inputCls} inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="2500" required />
          </Field>
          <Field label="Sale price (Rs)" hint="Leave empty for no sale.">
            <input className={inputCls} inputMode="numeric" value={salePrice} onChange={(e) => setSalePrice(e.target.value)} />
          </Field>
          <Field label="Stock">
            <input className={inputCls} inputMode="numeric" value={stock} onChange={(e) => setStock(e.target.value)} />
          </Field>
          <Field label="Low-stock threshold">
            <input className={inputCls} inputMode="numeric" value={lowStockThreshold} onChange={(e) => setLowStockThreshold(e.target.value)} />
          </Field>
          <Field label="Scheduled publish at" hint="Optional — used by the storefront.">
            <input type="datetime-local" className={inputCls} value={publishedAt} onChange={(e) => setPublishedAt(e.target.value)} />
          </Field>
        </div>
      </Card>

      <Card title="Images" actions={<span className="text-xs text-gray-500">First image is the main image</span>}>
        <div className="mb-3 flex flex-wrap gap-3">
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files) uploadFiles(e.target.files);
              e.target.value = "";
            }}
          />
          <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className={btnSecondary}>
            <IconImage className="h-4 w-4" /> {uploading ? "Uploading…" : "Upload images"}
          </button>
          <div className="flex min-w-[13rem] flex-1 gap-2">
            <input className={inputCls} placeholder="Paste image URL…" value={urlDraft} onChange={(e) => setUrlDraft(e.target.value)} />
            <button
              type="button"
              className={btnSecondary}
              onClick={() => {
                if (urlDraft.trim()) {
                  setImages((p) => [...p, urlDraft.trim()]);
                  setUrlDraft("");
                }
              }}
            >
              Add
            </button>
          </div>
        </div>
        {images.length === 0 ? (
          <p className="text-sm text-gray-500">No images yet. Upload files or paste URLs.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {images.map((src, i) => (
              <div key={`${src}-${i}`} className="relative rounded-md border border-gray-200 bg-gray-50 p-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt={`Product image ${i + 1}`} className="h-28 w-full rounded object-cover" />
                {i === 0 ? (
                  <span className="absolute left-2 top-2 rounded bg-gray-900 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-white">
                    Main
                  </span>
                ) : null}
                <div className="mt-1 flex items-center justify-between">
                  <div className="flex gap-1">
                    <button type="button" onClick={() => moveImage(i, -1)} disabled={i === 0} className="rounded px-1.5 py-0.5 text-xs text-gray-600 hover:bg-gray-200 disabled:opacity-30" aria-label="Move left">←</button>
                    <button type="button" onClick={() => moveImage(i, 1)} disabled={i === images.length - 1} className="rounded px-1.5 py-0.5 text-xs text-gray-600 hover:bg-gray-200 disabled:opacity-30" aria-label="Move right">→</button>
                    {i !== 0 ? (
                      <button type="button" onClick={() => setImages((p) => [p[i], ...p.filter((_, j) => j !== i)])} className="rounded px-1.5 py-0.5 text-xs font-medium text-gray-700 hover:bg-gray-200">
                        Set main
                      </button>
                    ) : null}
                  </div>
                  <button type="button" onClick={() => setImages((p) => p.filter((_, j) => j !== i))} className="rounded p-1 text-red-600 hover:bg-red-50" aria-label="Remove image">
                    <IconX className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card title="Description">
        <Field label="Full description" hint="HTML is allowed and will be rendered on the product page.">
          <textarea className={cn(inputCls, "font-mono")} rows={8} value={description} onChange={(e) => setDescription(e.target.value)} />
        </Field>
      </Card>

      <Card
        title="Specifications"
        actions={
          <button type="button" onClick={() => setSpecRows((r) => [...r, { key: "", value: "" }])} className="inline-flex items-center gap-1 text-xs font-medium text-gray-700 hover:underline">
            <IconPlus className="h-3.5 w-3.5" /> Add row
          </button>
        }
      >
        <div className="space-y-2">
          {specRows.map((r, i) => (
            <div key={i} className="flex gap-2">
              <input className={inputCls} placeholder="Key (e.g. Material)" value={r.key} onChange={(e) => setSpecRows((rows) => rows.map((x, j) => (j === i ? { ...x, key: e.target.value } : x)))} />
              <input className={inputCls} placeholder="Value" value={r.value} onChange={(e) => setSpecRows((rows) => rows.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))} />
              <button type="button" onClick={() => setSpecRows((rows) => rows.filter((_, j) => j !== i))} className="shrink-0 rounded p-2 text-red-600 hover:bg-red-50" aria-label="Remove row">
                <IconTrash className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </Card>

      <Card
        title="Variants"
        actions={
          <button type="button" onClick={() => setVariantRows((r) => [...r, { name: "", value: "", priceAdjust: "0", stock: "", sku: "" }])} className="inline-flex items-center gap-1 text-xs font-medium text-gray-700 hover:underline">
            <IconPlus className="h-3.5 w-3.5" /> Add variant
          </button>
        }
      >
        <div className="space-y-2">
          <div className="hidden gap-2 text-xs font-medium uppercase text-gray-400 md:grid md:grid-cols-[1fr_1fr_100px_100px_1fr_40px]">
            <span>Name</span><span>Value</span><span>Price ±</span><span>Stock</span><span>SKU</span><span />
          </div>
          {variantRows.map((r, i) => (
            <div key={i} className="grid gap-2 md:grid-cols-[1fr_1fr_100px_100px_1fr_40px]">
              <input className={inputCls} placeholder="Size" value={r.name} onChange={(e) => setVariantRows((rows) => rows.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} />
              <input className={inputCls} placeholder="Large" value={r.value} onChange={(e) => setVariantRows((rows) => rows.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))} />
              <input className={inputCls} placeholder="0" inputMode="numeric" value={r.priceAdjust} onChange={(e) => setVariantRows((rows) => rows.map((x, j) => (j === i ? { ...x, priceAdjust: e.target.value } : x)))} />
              <input className={inputCls} placeholder="blank = shared" inputMode="numeric" value={r.stock} onChange={(e) => setVariantRows((rows) => rows.map((x, j) => (j === i ? { ...x, stock: e.target.value } : x)))} />
              <input className={inputCls} placeholder="SKU" value={r.sku} onChange={(e) => setVariantRows((rows) => rows.map((x, j) => (j === i ? { ...x, sku: e.target.value } : x)))} />
              <button type="button" onClick={() => setVariantRows((rows) => rows.filter((_, j) => j !== i))} className="rounded p-2 text-red-600 hover:bg-red-50" aria-label="Remove variant">
                <IconTrash className="h-4 w-4" />
              </button>
            </div>
          ))}
          <p className="text-xs text-gray-500">Rows with an empty value are ignored. Price adjust is added to the base price (use a negative number for a discount).</p>
        </div>
      </Card>

      <Card title="SEO">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="SEO title">
            <input className={inputCls} value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} />
          </Field>
          <Field label="SEO keywords" hint="Comma separated.">
            <input className={inputCls} value={seoKeywords} onChange={(e) => setSeoKeywords(e.target.value)} />
          </Field>
          <div className="md:col-span-2">
            <Field label="SEO description">
              <textarea className={inputCls} rows={2} value={seoDescription} onChange={(e) => setSeoDescription(e.target.value)} />
            </Field>
          </div>
        </div>
      </Card>

      <div className="flex items-center gap-3">
        <button type="submit" disabled={saving} className={btnPrimary}>
          {saving ? "Saving…" : product ? "Save changes" : "Create product"}
        </button>
        <button type="button" onClick={() => router.push("/admin/products")} className={btnSecondary}>
          Cancel
        </button>
      </div>
    </form>
  );
}
