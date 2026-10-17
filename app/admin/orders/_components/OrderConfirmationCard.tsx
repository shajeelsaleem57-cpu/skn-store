"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "../../_components/toast";
import { Card, btnPrimary, btnSecondary } from "../../_components/ui";

type RiskFlag = { code: string; detail: string };

const FLAG_LABELS: Record<string, string> = {
  INVALID_PHONE: "Invalid phone format",
  DUP_CANCELLED: "Number had a cancelled order",
  REFUSED_ADDRESS: "Refused address match",
};

export function OrderConfirmationCard({
  orderId,
  orderNumber,
  status,
  riskFlagsJson,
  customerMobile,
  adminWhatsAppHref,
  address,
  city,
}: {
  orderId: string;
  orderNumber: string;
  status: string;
  riskFlagsJson: string;
  customerMobile: string;
  adminWhatsAppHref: string;
  address: string;
  city: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");

  let flags: RiskFlag[] = [];
  try {
    const parsed = JSON.parse(riskFlagsJson || "[]");
    if (Array.isArray(parsed)) flags = parsed;
  } catch {
    flags = [];
  }

  const awaiting = status === "PENDING_CONFIRMATION";

  async function updateStatus(newStatus: string, action: string) {
    setError("");
    setBusy(action);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Update failed");
      toast(action === "confirm" ? "Order confirmed — ready for dispatch." : "Confirmation hold cleared.");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    } finally {
      setBusy(null);
    }
  }

  async function markRefused() {
    setError("");
    setBusy("refused");
    try {
      const res = await fetch(`/api/admin/refused-addresses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, city, note: `From order ${orderNumber}` }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Failed to save");
      toast("Address marked as refused — future orders to it will be flagged.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setBusy(null);
    }
  }

  return (
    <Card title="Confirmation & risk check">
      {awaiting ? (
        <p className="mb-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          This order is <strong>awaiting WhatsApp confirmation</strong> and cannot enter the dispatch
          queue until it is confirmed or the hold is cleared.
        </p>
      ) : (
        <p className="mb-3 text-sm text-gray-600">
          Confirmation status: <strong>{status === "CONFIRMED" ? "Confirmed" : status}</strong>
        </p>
      )}

      <div className="mb-4">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">Risk flags</p>
        {flags.length === 0 ? (
          <p className="text-sm text-gray-600">No risk flags — number and address look clean.</p>
        ) : (
          <ul className="space-y-1.5">
            {flags.map((f, i) => (
              <li key={i} className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm">
                <span className="font-semibold text-red-800">⚠ {FLAG_LABELS[f.code] ?? f.code}</span>
                <span className="block text-red-700">{f.detail}</span>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-1 text-xs text-gray-400">
          Flags advise you — they never certify an order as genuine or fake.
        </p>
      </div>

      {error ? (
        <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <a
          href={adminWhatsAppHref}
          target="_blank"
          rel="noopener noreferrer"
          className={btnSecondary}
          title={`Message ${customerMobile} on WhatsApp`}
        >
          WhatsApp customer
        </a>
        {awaiting ? (
          <>
            <button
              className={btnPrimary}
              disabled={busy !== null}
              onClick={() => updateStatus("CONFIRMED", "confirm")}
            >
              {busy === "confirm" ? "Saving…" : "Mark as confirmed"}
            </button>
            <button
              className={btnSecondary}
              disabled={busy !== null}
              onClick={() => updateStatus("NEW", "clear")}
            >
              {busy === "clear" ? "Saving…" : "Clear hold"}
            </button>
          </>
        ) : null}
        <button className={btnSecondary} disabled={busy !== null} onClick={markRefused}>
          {busy === "refused" ? "Saving…" : "Mark address as refused"}
        </button>
      </div>
    </Card>
  );
}
