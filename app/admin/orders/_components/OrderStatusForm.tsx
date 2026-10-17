"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Order } from "@prisma/client";
import { ORDER_STATUSES, ORDER_STATUS_LABELS } from "@/lib/constants";
import { useToast } from "../../_components/toast";
import { Field, btnPrimary, inputCls } from "../../_components/ui";

export function OrderStatusForm({ order }: { order: Order }) {
  const router = useRouter();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [status, setStatus] = useState(order.status);
  const [courier, setCourier] = useState(order.courier ?? "");
  const [trackingNumber, setTrackingNumber] = useState(order.trackingNumber ?? "");
  const [trackingUrl, setTrackingUrl] = useState(order.trackingUrl ?? "");
  const [internalNotes, setInternalNotes] = useState(order.internalNotes ?? "");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/orders/${order.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, courier, trackingNumber, trackingUrl, internalNotes }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Update failed");
      toast("Order updated");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
      ) : null}
      <Field label="Order status">
        <select className={inputCls} value={status} onChange={(e) => setStatus(e.target.value as Order["status"])}>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {ORDER_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </Field>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Courier">
          <input className={inputCls} value={courier} onChange={(e) => setCourier(e.target.value)} placeholder="e.g. TCS, Leopards" />
        </Field>
        <Field label="Tracking number">
          <input className={inputCls} value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} />
        </Field>
      </div>
      <Field label="Tracking URL">
        <input className={inputCls} value={trackingUrl} onChange={(e) => setTrackingUrl(e.target.value)} placeholder="https://…" />
      </Field>
      <Field label="Internal notes" hint="Only visible to admins — never shown to the customer.">
        <textarea className={inputCls} rows={3} value={internalNotes} onChange={(e) => setInternalNotes(e.target.value)} />
      </Field>
      <button type="submit" disabled={saving} className={btnPrimary}>
        {saving ? "Saving…" : "Update order"}
      </button>
    </form>
  );
}
