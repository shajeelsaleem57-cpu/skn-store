"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "../../_components/toast";
import { Card, Field, btnPrimary, inputCls } from "../../_components/ui";

const FIELDS: { key: string; label: string; hint?: string; textarea?: boolean }[] = [
  { key: "store_name", label: "Store name" },
  { key: "site_url", label: "Site URL", hint: "e.g. https://sknstore.online" },
  { key: "whatsapp_number", label: "WhatsApp number", hint: "Digits only, international format (e.g. 923287533227)" },
  { key: "whatsapp_display", label: "WhatsApp display number", hint: "Shown to customers (e.g. 0328 7533227)" },
  { key: "announcement_bar", label: "Announcement messages", hint: "Separate multiple messages with | (pipe), e.g. Free delivery | COD available" },
  { key: "announcement_bg", label: "Announcement background color", hint: "Hex color, e.g. #111111 (leave empty for theme primary)" },
  { key: "announcement_color", label: "Announcement text color", hint: "Hex color, e.g. #ffffff (leave empty for white)" },
  { key: "announcement_size", label: "Announcement font size (px)", hint: "e.g. 12" },
  { key: "announcement_speed", label: "Announcement scroll speed (seconds per loop)", hint: "Lower = faster, e.g. 30" },
  { key: "contact_email", label: "Contact email" },
  { key: "contact_address", label: "Contact address", textarea: true },
  { key: "currency", label: "Currency", hint: "e.g. PKR" },
  { key: "delivery_info", label: "Delivery info", textarea: true },
  { key: "return_info", label: "Return info", textarea: true },
  { key: "meta_title", label: "Meta title", hint: "Default SEO title for the storefront" },
  { key: "meta_description", label: "Meta description", textarea: true },
];

export function SettingsForm({ initial }: { initial: Record<string, string> }) {
  const router = useRouter();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [values, setValues] = useState<Record<string, string>>(initial);
  const [announcementVisible, setAnnouncementVisible] = useState(initial.announcement_visible !== "0");

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, announcement_visible: announcementVisible ? "1" : "0" }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Save failed");
      toast("Settings saved");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save} className="space-y-4">
      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
      ) : null}

      <Card title="General">
        <div className="grid gap-4 md:grid-cols-2">
          {FIELDS.map((f) => (
            <div key={f.key} className={f.textarea ? "md:col-span-2" : undefined}>
              <Field label={f.label} hint={f.hint}>
                {f.textarea ? (
                  <textarea
                    className={inputCls}
                    rows={3}
                    value={values[f.key] ?? ""}
                    onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                  />
                ) : (
                  <input
                    className={inputCls}
                    value={values[f.key] ?? ""}
                    onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                  />
                )}
              </Field>
            </div>
          ))}
          <div className="flex items-center gap-2">
            <input
              id="set-ann-visible"
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
              checked={announcementVisible}
              onChange={(e) => setAnnouncementVisible(e.target.checked)}
            />
            <label htmlFor="set-ann-visible" className="text-sm text-gray-700">Show announcement bar</label>
          </div>
        </div>
      </Card>

      <button type="submit" disabled={saving} className={btnPrimary}>
        {saving ? "Saving…" : "Save settings"}
      </button>
    </form>
  );
}
