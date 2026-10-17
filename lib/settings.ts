import { prisma } from "./prisma";
import { DEFAULT_COLORS, type SiteColors } from "./utils";

// Re-export for server-side importers (client components should import from @/lib/utils).
export type { SiteColors };
export { DEFAULT_COLORS };

let settingsCache: Map<string, string> | null = null;

export async function getAllSettings(): Promise<Map<string, string>> {
  if (settingsCache) return settingsCache;
  const rows = await prisma.siteSetting.findMany();
  settingsCache = new Map(rows.map((r) => [r.key, r.value]));
  return settingsCache;
}

export function clearSettingsCache() {
  settingsCache = null;
}

export async function getSetting(key: string, fallback = ""): Promise<string> {
  const all = await getAllSettings();
  return all.get(key) ?? fallback;
}

export async function getColors(): Promise<SiteColors> {
  const raw = await getSetting("colors", "");
  if (!raw) return DEFAULT_COLORS;
  try {
    return { ...DEFAULT_COLORS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_COLORS;
  }
}

export async function getWhatsAppNumber(): Promise<string> {
  return getSetting("whatsapp_number", process.env.NEXT_PUBLIC_WHATSAPP || "923287533227");
}
