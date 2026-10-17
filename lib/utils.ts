export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export function formatPKR(amount: number): string {
  return "Rs. " + Number(amount || 0).toLocaleString("en-PK");
}

export function slugify(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Validate a Pakistani mobile number. Accepts 03XXXXXXXXX, +923XXXXXXXXX, 923XXXXXXXXX. */
export function isValidPakistaniMobile(input: string): boolean {
  const digits = input.replace(/\D/g, "");
  if (/^03\d{9}$/.test(digits)) return true;
  if (/^923\d{9}$/.test(digits)) return true;
  return false;
}

/** Normalize any accepted Pakistani mobile format to 923XXXXXXXXX. Returns null if invalid. */
export function normalizePakistaniMobile(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  if (/^03\d{9}$/.test(digits)) return "92" + digits.slice(1);
  if (/^923\d{9}$/.test(digits)) return digits;
  return null;
}

/** Display format: 923XXXXXXXXX -> "0328 7533227" style (03XX XXXXXXX). */
export function displayPakistaniMobile(normalized: string): string {
  const digits = normalized.replace(/\D/g, "");
  const local = digits.startsWith("92") ? "0" + digits.slice(2) : digits;
  if (/^0\d{10}$/.test(local)) return `${local.slice(0, 4)} ${local.slice(4)}`;
  return normalized;
}

export function generateOrderNumber(): string {
  const d = new Date();
  const date = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `SKN-${date}-${rand}`;
}

export function discountPercent(price: number, salePrice: number | null): number | null {
  if (!salePrice || salePrice >= price) return null;
  return Math.round(((price - salePrice) / price) * 100);
}

export function effectivePrice(price: number, salePrice: number | null): number {
  return salePrice && salePrice < price ? salePrice : price;
}

export function parseImages(images: string | null): string[] {
  if (!images) return [];
  try {
    const arr = JSON.parse(images);
    return Array.isArray(arr) ? arr.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function parseSpecs(specs: string | null): Record<string, string> {
  if (!specs) return {};
  try {
    const obj = JSON.parse(specs);
    return obj && typeof obj === "object" ? obj : {};
  } catch {
    return {};
  }
}

export function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n - 1).trimEnd() + "…" : s;
}

/** Build a wa.me link with a prefilled message. Pure function, safe for client components. */
export function buildWhatsAppLink(phone: string, message: string): string {
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

export type SiteColors = {
  primary: string;
  secondary: string;
  background: string;
  softBg: string;
  accent: string;
  success: string;
  sale: string;
  text: string;
  mutedText: string;
  border: string;
  warning: string;
  error: string;
  cardBg: string;
  radius: string;
};

export const DEFAULT_COLORS: SiteColors = {
  primary: "#111111",
  secondary: "#2B2B2B",
  background: "#FFFFFF",
  softBg: "#F7F7F7",
  accent: "#C8A96B",
  success: "#16803C",
  sale: "#C62828",
  text: "#171717",
  mutedText: "#6B7280",
  border: "#E5E5E5",
  warning: "#B45309",
  error: "#B91C1C",
  cardBg: "#FFFFFF",
  radius: "12px",
};
