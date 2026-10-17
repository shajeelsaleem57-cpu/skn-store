"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { DEFAULT_COLORS, type SiteColors } from "@/lib/utils";
import { useToast } from "../../_components/toast";
import { Card, Field, btnPrimary, inputCls } from "../../_components/ui";
import { ImageInput } from "../../_components/ImageInput";

const COLOR_LABELS: Record<keyof SiteColors, string> = {
  primary: "Primary",
  secondary: "Secondary",
  background: "Background",
  softBg: "Soft background",
  cardBg: "Card background",
  accent: "Accent",
  success: "Success",
  sale: "Sale",
  text: "Text",
  mutedText: "Muted text",
  border: "Border",
  warning: "Warning",
  error: "Error",
  radius: "Corner radius",
};

export function AppearanceForm({
  initial,
  initialColors,
}: {
  initial: Record<string, string>;
  initialColors: SiteColors;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [colors, setColors] = useState<SiteColors>(initialColors);
  const [logoUrl, setLogoUrl] = useState(initial.logo_url ?? "");
  const [faviconUrl, setFaviconUrl] = useState(initial.favicon_url ?? "");
  const [announcementVisible, setAnnouncementVisible] = useState(initial.announcement_visible !== "0");
  const [socials, setSocials] = useState({
    facebook: initial.social_facebook ?? "",
    instagram: initial.social_instagram ?? "",
    tiktok: initial.social_tiktok ?? "",
    youtube: initial.social_youtube ?? "",
  });
  const [whatsappNumber, setWhatsappNumber] = useState(initial.whatsapp_number ?? "");
  const [whatsappDisplay, setWhatsappDisplay] = useState(initial.whatsapp_display ?? "");

  const setColor = (key: keyof SiteColors, value: string) =>
    setColors((c) => ({ ...c, [key]: value }));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          colors: JSON.stringify(colors),
          logo_url: logoUrl.trim(),
          favicon_url: faviconUrl.trim(),
          announcement_visible: announcementVisible ? "1" : "0",
          social_facebook: socials.facebook.trim(),
          social_instagram: socials.instagram.trim(),
          social_tiktok: socials.tiktok.trim(),
          social_youtube: socials.youtube.trim(),
          whatsapp_number: whatsappNumber.trim(),
          whatsapp_display: whatsappDisplay.trim(),
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Save failed");
      toast("Appearance saved");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const reset = () => setColors(DEFAULT_COLORS);

  return (
    <form onSubmit={save} className="space-y-4">
      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card
          title="Theme colors"
          actions={
            <button type="button" onClick={reset} className="text-xs font-medium text-gray-600 hover:underline">
              Reset to defaults
            </button>
          }
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {(Object.keys(COLOR_LABELS) as (keyof SiteColors)[]).map((key) =>
              key === "radius" ? (
                <Field key={key} label={COLOR_LABELS[key]}>
                  <input className={inputCls} value={colors.radius} onChange={(e) => setColor("radius", e.target.value)} placeholder="12px" />
                </Field>
              ) : (
                <Field key={key} label={COLOR_LABELS[key]}>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={/^#[0-9a-fA-F]{6}$/.test(colors[key]) ? colors[key] : "#000000"}
                      onChange={(e) => setColor(key, e.target.value)}
                      className="h-9 w-12 shrink-0 cursor-pointer rounded border border-gray-300 bg-white p-0.5"
                      aria-label={`${COLOR_LABELS[key]} color picker`}
                    />
                    <input
                      className={`${inputCls} font-mono`}
                      value={colors[key]}
                      onChange={(e) => setColor(key, e.target.value)}
                      placeholder="#000000"
                    />
                  </div>
                </Field>
              )
            )}
          </div>
        </Card>

        <div className="space-y-4">
          <Card title="Live preview">
            <div className="overflow-hidden rounded-md border" style={{ borderColor: colors.border, borderRadius: colors.radius, background: colors.background }}>
              {announcementVisible ? (
                <div className="px-3 py-1.5 text-center text-xs font-medium text-white" style={{ background: colors.primary }}>
                  Announcement bar preview
                </div>
              ) : null}
              <div className="flex items-center justify-between px-4 py-3" style={{ background: colors.cardBg }}>
                <span className="font-bold" style={{ color: colors.text }}>Store logo</span>
                <span className="text-xs" style={{ color: colors.mutedText }}>Search · Cart</span>
              </div>
              <div className="px-4 py-4" style={{ background: colors.softBg }}>
                <p className="text-sm font-semibold" style={{ color: colors.text }}>Product card</p>
                <p className="text-xs" style={{ color: colors.mutedText }}>Muted description text</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="rounded px-2 py-1 text-xs font-bold text-white" style={{ background: colors.primary, borderRadius: colors.radius }}>
                    Add to cart
                  </span>
                  <span className="rounded px-2 py-1 text-xs font-bold text-white" style={{ background: colors.sale, borderRadius: colors.radius }}>
                    -20%
                  </span>
                  <span className="rounded px-2 py-1 text-xs font-bold text-white" style={{ background: colors.success, borderRadius: colors.radius }}>
                    In stock
                  </span>
                </div>
                <p className="mt-2 text-xs font-medium" style={{ color: colors.accent }}>Accent link or highlight</p>
                <p className="mt-1 text-xs" style={{ color: colors.warning }}>Warning notice example</p>
                <p className="text-xs" style={{ color: colors.error }}>Error notice example</p>
              </div>
              <div className="px-4 py-2 text-xs" style={{ background: colors.secondary, color: "#fff" }}>
                Footer preview
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {(Object.keys(COLOR_LABELS) as (keyof SiteColors)[])
                .filter((k) => k !== "radius")
                .map((k) => (
                  <span key={k} title={`${COLOR_LABELS[k]}: ${colors[k]}`} className="h-7 w-7 rounded border border-gray-300" style={{ background: colors[k] }} />
                ))}
            </div>
          </Card>

          <Card title="Branding">
            <div className="space-y-4">
              <ImageInput label="Logo" value={logoUrl} onChange={setLogoUrl} />
              <ImageInput label="Favicon" value={faviconUrl} onChange={setFaviconUrl} />
              <div className="flex items-center gap-2">
                <input
                  id="ann-visible"
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                  checked={announcementVisible}
                  onChange={(e) => setAnnouncementVisible(e.target.checked)}
                />
                <label htmlFor="ann-visible" className="text-sm text-gray-700">Show announcement bar</label>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <Card title="Social links">
        <div className="grid gap-4 md:grid-cols-2">
          {(["facebook", "instagram", "tiktok", "youtube"] as const).map((k) => (
            <Field key={k} label={k[0].toUpperCase() + k.slice(1)}>
              <input
                className={inputCls}
                value={socials[k]}
                onChange={(e) => setSocials((s) => ({ ...s, [k]: e.target.value }))}
                placeholder="https://…"
              />
            </Field>
          ))}
        </div>
      </Card>

      <Card title="WhatsApp">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="WhatsApp number" hint="International format, digits only (e.g. 923287533227).">
            <input className={inputCls} value={whatsappNumber} onChange={(e) => setWhatsappNumber(e.target.value)} placeholder="923287533227" />
          </Field>
          <Field label="Display number" hint="How the number appears to customers (e.g. 0328 7533227).">
            <input className={inputCls} value={whatsappDisplay} onChange={(e) => setWhatsappDisplay(e.target.value)} />
          </Field>
        </div>
      </Card>

      <button type="submit" disabled={saving} className={btnPrimary}>
        {saving ? "Saving…" : "Save appearance"}
      </button>
    </form>
  );
}
