export function parseCouponBody(body: Record<string, unknown>) {
  const code = String(body.code ?? "").trim().toUpperCase().replace(/\s+/g, "");
  if (!code) return { error: "Coupon code is required" } as const;
  const type = String(body.type ?? "PERCENT").toUpperCase();
  if (type !== "PERCENT" && type !== "FIXED") return { error: "Type must be PERCENT or FIXED" } as const;

  const valueRaw = toOptInt(body.value);
  if (valueRaw === null || valueRaw <= 0) return { error: "Value must be a positive number" } as const;
  if (type === "PERCENT" && valueRaw > 100) return { error: "Percent value cannot exceed 100" } as const;

  const expiresRaw = String(body.expiresAt ?? "").trim();

  return {
    data: {
      code,
      type,
      value: valueRaw,
      minOrder: toOptInt(body.minOrder),
      maxDiscount: toOptInt(body.maxDiscount),
      expiresAt: expiresRaw ? new Date(expiresRaw) : null,
      usageLimit: toOptInt(body.usageLimit),
      perUserLimit: toOptInt(body.perUserLimit),
      isActive: body.isActive !== false,
    },
  } as const;
}


export function toOptInt(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "string" ? parseInt(v, 10) : typeof v === "number" ? Math.trunc(v) : NaN;
  return Number.isFinite(n) ? n : null;
}
