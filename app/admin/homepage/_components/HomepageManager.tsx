"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { HomepageSection } from "@prisma/client";
import { useToast } from "../../_components/toast";
import { ToggleSwitch } from "../../_components/client";
import { Card, Field, Pill, btnPrimary, btnSecondary, inputCls } from "../../_components/ui";
import { IconArrowDown, IconArrowUp, IconEdit } from "../../_components/icons";
import { ImageInput } from "../../_components/ImageInput";

function parseConfig(raw: string): Record<string, unknown> {
  try {
    const v = JSON.parse(raw) as unknown;
    return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function toDateTimeLocal(v: unknown): string {
  if (typeof v !== "string" || !v) return "";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function SectionEditor({
  section,
  products,
  onClose,
}: {
  section: HomepageSection;
  products: { id: string; title: string }[];
  onClose: () => void;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState(section.name);
  const [config, setConfig] = useState<Record<string, unknown>>(() => parseConfig(section.config));
  const [jsonText, setJsonText] = useState(() => JSON.stringify(parseConfig(section.config), null, 2));
  const [jsonError, setJsonError] = useState("");

  const setCfg = (patch: Record<string, unknown>) => {
    const next = { ...config, ...patch };
    setConfig(next);
    setJsonText(JSON.stringify(next, null, 2));
    setJsonError("");
  };

  const onJsonChange = (text: string) => {
    setJsonText(text);
    try {
      const v = JSON.parse(text) as unknown;
      if (!v || typeof v !== "object" || Array.isArray(v)) throw new Error("must be an object");
      setConfig(v as Record<string, unknown>);
      setJsonError("");
    } catch {
      setJsonError("Invalid JSON — fix it before saving.");
    }
  };

  const save = async () => {
    setError("");
    if (jsonError) {
      setError("Config JSON is invalid.");
      return;
    }
    if (!name.trim()) {
      setError("Section name is required.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/homepage/${section.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), config }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Save failed");
      toast("Section updated");
      router.refresh();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-3 rounded-md border border-gray-200 bg-gray-50 p-4">
      {error ? (
        <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Section name">
          <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <div className="flex items-end pb-1">
          <span className="text-xs text-gray-500">Type: <span className="font-mono font-semibold text-gray-700">{section.type}</span></span>
        </div>
      </div>

      {section.type === "hero" ? (
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Field label="Heading"><input className={inputCls} value={str(config.heading)} onChange={(e) => setCfg({ heading: e.target.value })} /></Field>
          <Field label="Description"><input className={inputCls} value={str(config.description)} onChange={(e) => setCfg({ description: e.target.value })} /></Field>
          <Field label="CTA text"><input className={inputCls} value={str(config.ctaText)} onChange={(e) => setCfg({ ctaText: e.target.value })} /></Field>
          <Field label="CTA URL"><input className={inputCls} value={str(config.ctaUrl)} onChange={(e) => setCfg({ ctaUrl: e.target.value })} /></Field>
          <Field label="Secondary CTA text"><input className={inputCls} value={str(config.secondaryCtaText)} onChange={(e) => setCfg({ secondaryCtaText: e.target.value })} /></Field>
          <Field label="Secondary CTA URL"><input className={inputCls} value={str(config.secondaryCtaUrl)} onChange={(e) => setCfg({ secondaryCtaUrl: e.target.value })} /></Field>
          <Field label="Alignment">
            <select className={inputCls} value={str(config.alignment) || "left"} onChange={(e) => setCfg({ alignment: e.target.value })}>
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </select>
          </Field>
          <Field label="Background (color or image URL)"><input className={inputCls} value={str(config.background)} onChange={(e) => setCfg({ background: e.target.value })} /></Field>
          <div className="md:col-span-2">
            <ImageInput label="Hero image" value={str(config.image)} onChange={(url) => setCfg({ image: url })} />
          </div>
        </div>
      ) : null}

      {section.type === "flash_deal" ? (
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Field label="Deal product">
            <select className={inputCls} value={str(config.productId)} onChange={(e) => setCfg({ productId: e.target.value })}>
              <option value="">Select a product…</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
          </Field>
          <Field label="Deal ends at">
            <input type="datetime-local" className={inputCls} value={toDateTimeLocal(config.endsAt)} onChange={(e) => setCfg({ endsAt: e.target.value ? new Date(e.target.value).toISOString() : "" })} />
          </Field>
          <div className="flex items-center gap-2">
            <input
              id={`cd-${section.id}`}
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
              checked={config.countdownEnabled === true}
              onChange={(e) => setCfg({ countdownEnabled: e.target.checked })}
            />
            <label htmlFor={`cd-${section.id}`} className="text-sm text-gray-700">Show countdown timer</label>
          </div>
        </div>
      ) : null}

      <div className="mt-4">
        <Field label="Config (JSON)" error={jsonError} hint="Advanced: every field above is stored here. Editing the JSON directly is fine.">
          <textarea className={`${inputCls} font-mono text-xs`} rows={8} value={jsonText} onChange={(e) => onJsonChange(e.target.value)} spellCheck={false} />
        </Field>
      </div>

      <div className="mt-4 flex gap-2">
        <button type="button" onClick={save} disabled={saving} className={btnPrimary}>
          {saving ? "Saving…" : "Save section"}
        </button>
        <button type="button" onClick={onClose} className={btnSecondary}>Cancel</button>
      </div>
    </div>
  );
}

export function HomepageManager({
  sections,
  products,
}: {
  sections: HomepageSection[];
  products: { id: string; title: string }[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const call = async (url: string, method: string, body: unknown, message: string) => {
    setBusy(true);
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Request failed");
      toast(message);
      router.refresh();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Request failed", "error");
    } finally {
      setBusy(false);
    }
  };

  const toggle = (s: HomepageSection) =>
    call(`/api/admin/homepage/${s.id}`, "PUT", { isVisible: !s.isVisible }, s.isVisible ? "Section hidden" : "Section shown");

  const move = (index: number, dir: -1 | 1) => {
    const j = index + dir;
    if (j < 0 || j >= sections.length) return;
    const ids = sections.map((s) => s.id);
    [ids[index], ids[j]] = [ids[j], ids[index]];
    call("/api/admin/homepage/reorder", "PATCH", { orderedIds: ids }, "Order updated");
  };

  return (
    <Card title="Homepage sections" className={busy ? "pointer-events-none opacity-60" : undefined}>
      <div className="space-y-2">
        {sections.map((s, i) => (
          <div key={s.id} className="rounded-md border border-gray-200 bg-white">
            <div className="flex items-center gap-2 px-3 py-2.5">
              <div className="flex shrink-0 flex-col">
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0 || busy} className="p-0.5 text-gray-500 hover:text-gray-900 disabled:opacity-25" aria-label="Move up">
                  <IconArrowUp className="h-3.5 w-3.5" />
                </button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === sections.length - 1 || busy} className="p-0.5 text-gray-500 hover:text-gray-900 disabled:opacity-25" aria-label="Move down">
                  <IconArrowDown className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900">{s.name}</p>
                <p className="font-mono text-xs text-gray-500">{s.type}</p>
              </div>
              {s.isVisible ? <Pill tone="green">Visible</Pill> : <Pill tone="gray">Hidden</Pill>}
              <ToggleSwitch checked={s.isVisible} onChange={() => toggle(s)} label={`Toggle ${s.name}`} />
              <button
                type="button"
                onClick={() => setEditingId(editingId === s.id ? null : s.id)}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100"
              >
                <IconEdit className="h-3.5 w-3.5" /> Configure
              </button>
            </div>
            {editingId === s.id ? (
              <div className="px-3 pb-3">
                <SectionEditor section={s} products={products} onClose={() => setEditingId(null)} />
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </Card>
  );
}
