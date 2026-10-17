"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Coupon } from "@prisma/client";
import { useToast } from "../../_components/toast";
import { Card, Field, btnPrimary, btnSecondary, inputCls } from "../../_components/ui";

function toDateTimeLocal(v: string | Date | null | undefined): string {
  if (!v) return "";
  const d = v instanceof Date ? v : new Date(v);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function CouponForm({ coupon }: { coupon: Coupon | null }) {
  const router = useRouter();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [code, setCode] = useState(coupon?.code ?? "");
  const [type, setType] = useState(coupon?.type ?? "PERCENT");
  const [value, setValue] = useState(coupon ? String(coupon.value) : "");
  const [minOrder, setMinOrder] = useState(coupon?.minOrder != null ? String(coupon.minOrder) : "");
  const [maxDiscount, setMaxDiscount] = useState(coupon?.maxDiscount != null ? String(coupon.maxDiscount) : "");
  const [expiresAt, setExpiresAt] = useState(toDateTimeLocal(coupon?.expiresAt));
  const [usageLimit, setUsageLimit] = useState(coupon?.usageLimit != null ? String(coupon.usageLimit) : "");
  const [perUserLimit, setPerUserLimit] = useState(coupon?.perUserLimit != null ? String(coupon.perUserLimit) : "");
  const [isActive, setIsActive] = useState(coupon?.isActive ?? true);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!code.trim()) {
      setError("Coupon code is required.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(coupon ? `/api/admin/coupons/${coupon.id}` : "/api/admin/coupons", {
        method: coupon ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          type,
          value: parseInt(value || "0", 10),
          minOrder: minOrder.trim() === "" ? null : parseInt(minOrder, 10),
          maxDiscount: maxDiscount.trim() === "" ? null : parseInt(maxDiscount, 10),
          expiresAt: expiresAt || null,
          usageLimit: usageLimit.trim() === "" ? null : parseInt(usageLimit, 10),
          perUserLimit: perUserLimit.trim() === "" ? null : parseInt(perUserLimit, 10),
          isActive,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Save failed");
      toast(coupon ? "Coupon updated" : "Coupon created");
      router.push("/admin/coupons");
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
      <Card title="Coupon details">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Code *" hint="Uppercase, no spaces (e.g. EID20).">
            <input className={`${inputCls} uppercase`} value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="EID20" required />
          </Field>
          <Field label="Discount type">
            <select className={inputCls} value={type} onChange={(e) => setType(e.target.value)}>
              <option value="PERCENT">Percent (%)</option>
              <option value="FIXED">Fixed (Rs)</option>
            </select>
          </Field>
          <Field label={type === "PERCENT" ? "Value (%)*" : "Value (Rs) *"}>
            <input className={inputCls} inputMode="numeric" value={value} onChange={(e) => setValue(e.target.value)} placeholder={type === "PERCENT" ? "20" : "500"} required />
          </Field>
          <Field label="Minimum order (Rs)" hint="Order subtotal must reach this.">
            <input className={inputCls} inputMode="numeric" value={minOrder} onChange={(e) => setMinOrder(e.target.value)} placeholder="Optional" />
          </Field>
          <Field label="Max discount (Rs)" hint="Caps the discount for percent coupons.">
            <input className={inputCls} inputMode="numeric" value={maxDiscount} onChange={(e) => setMaxDiscount(e.target.value)} placeholder="Optional" />
          </Field>
          <Field label="Expires at">
            <input type="datetime-local" className={inputCls} value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
          </Field>
          <Field label="Total usage limit">
            <input className={inputCls} inputMode="numeric" value={usageLimit} onChange={(e) => setUsageLimit(e.target.value)} placeholder="Unlimited" />
          </Field>
          <Field label="Per-user limit">
            <input className={inputCls} inputMode="numeric" value={perUserLimit} onChange={(e) => setPerUserLimit(e.target.value)} placeholder="Unlimited" />
          </Field>
          <div className="flex items-center gap-2 pt-6">
            <input
              id="coupon-active"
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            <label htmlFor="coupon-active" className="text-sm text-gray-700">Active</label>
          </div>
          {coupon ? (
            <Field label="Times used">
              <input className={inputCls} value={coupon.usedCount} disabled />
            </Field>
          ) : null}
        </div>
      </Card>
      <div className="flex items-center gap-3">
        <button type="submit" disabled={saving} className={btnPrimary}>
          {saving ? "Saving…" : coupon ? "Save changes" : "Create coupon"}
        </button>
        <button type="button" onClick={() => router.push("/admin/coupons")} className={btnSecondary}>
          Cancel
        </button>
      </div>
    </form>
  );
}
