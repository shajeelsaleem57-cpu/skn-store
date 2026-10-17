"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Faq } from "@prisma/client";
import { useToast } from "../../_components/toast";
import { Card, EmptyState, Field, Pill, btnPrimary, btnSecondary, inputCls } from "../../_components/ui";
import { IconEdit, IconPlus, IconTrash } from "../../_components/icons";

type Draft = { question: string; answer: string; category: string; sortOrder: string; isVisible: boolean };

const EMPTY: Draft = { question: "", answer: "", category: "", sortOrder: "0", isVisible: true };

export function FaqManager({ faqs }: { faqs: Faq[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const startEdit = (f: Faq) => {
    setEditingId(f.id);
    setDraft({
      question: f.question,
      answer: f.answer,
      category: f.category ?? "",
      sortOrder: String(f.sortOrder),
      isVisible: f.isVisible,
    });
    setError("");
  };

  const cancel = () => {
    setEditingId(null);
    setDraft(EMPTY);
    setError("");
  };

  const save = async () => {
    setError("");
    if (!draft.question.trim() || !draft.answer.trim()) {
      setError("Question and answer are both required.");
      return;
    }
    setSaving(true);
    try {
      const url = editingId ? `/api/admin/faqs/${editingId}` : "/api/admin/faqs";
      const res = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: draft.question.trim(),
          answer: draft.answer.trim(),
          category: draft.category.trim(),
          sortOrder: parseInt(draft.sortOrder || "0", 10) || 0,
          isVisible: draft.isVisible,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Save failed");
      toast(editingId ? "FAQ updated" : "FAQ added");
      cancel();
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (f: Faq) => {
    if (!window.confirm(`Delete this FAQ?\n\n"${f.question}"`)) return;
    try {
      const res = await fetch(`/api/admin/faqs/${f.id}`, { method: "DELETE" });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Delete failed");
      toast("FAQ deleted");
      router.refresh();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Delete failed", "error");
    }
  };

  const form = (
    <div className="space-y-3">
      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</div>
      ) : null}
      <Field label="Question *">
        <input className={inputCls} value={draft.question} onChange={(e) => setDraft((d) => ({ ...d, question: e.target.value }))} placeholder="How long does delivery take?" />
      </Field>
      <Field label="Answer *">
        <textarea className={inputCls} rows={3} value={draft.answer} onChange={(e) => setDraft((d) => ({ ...d, answer: e.target.value }))} placeholder="Delivery takes 2–4 working days…" />
      </Field>
      <div className="grid gap-3 md:grid-cols-3">
        <Field label="Category">
          <input className={inputCls} value={draft.category} onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value }))} placeholder="Shipping" />
        </Field>
        <Field label="Sort order">
          <input className={inputCls} inputMode="numeric" value={draft.sortOrder} onChange={(e) => setDraft((d) => ({ ...d, sortOrder: e.target.value }))} />
        </Field>
        <div className="flex items-center gap-2 pt-6">
          <input
            id="faq-visible"
            type="checkbox"
            className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
            checked={draft.isVisible}
            onChange={(e) => setDraft((d) => ({ ...d, isVisible: e.target.checked }))}
          />
          <label htmlFor="faq-visible" className="text-sm text-gray-700">Visible</label>
        </div>
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={save} disabled={saving} className={btnPrimary}>
          {saving ? "Saving…" : editingId ? "Save changes" : "Add FAQ"}
        </button>
        {editingId ? (
          <button type="button" onClick={cancel} className={btnSecondary}>Cancel</button>
        ) : null}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <Card title={editingId ? "Edit FAQ" : "Add FAQ"}>{form}</Card>

      {faqs.length === 0 ? (
        <EmptyState title="No FAQs yet" message="Add the first frequently asked question above." />
      ) : (
        <div className="space-y-2">
          {faqs.map((f) => (
            <div key={f.id} className="rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{f.question}</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-gray-600">{f.answer}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {f.category ? <span className="text-xs text-gray-500">{f.category}</span> : null}
                    <span className="text-xs text-gray-400">Order: {f.sortOrder}</span>
                    {f.isVisible ? <Pill tone="green">Visible</Pill> : <Pill tone="gray">Hidden</Pill>}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button type="button" onClick={() => startEdit(f)} className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100">
                    <IconEdit className="h-3.5 w-3.5" /> Edit
                  </button>
                  <button type="button" onClick={() => remove(f)} className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50">
                    <IconTrash className="h-3.5 w-3.5" /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {editingId ? null : (
        <p className="flex items-center gap-1 text-xs text-gray-400">
          <IconPlus className="h-3 w-3" /> Tip: use sort order to control the display sequence on the storefront.
        </p>
      )}
    </div>
  );
}
