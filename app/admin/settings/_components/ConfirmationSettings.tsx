"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "../../_components/toast";
import { Card, Field, btnPrimary, btnSecondary, inputCls } from "../../_components/ui";

const TOGGLES: { key: string; label: string; hint: string }[] = [
  {
    key: "confirm_require",
    label: "Hold new COD orders for WhatsApp confirmation",
    hint: "When on, every new order starts as “Awaiting confirmation” and cannot be dispatched until confirmed or the hold is cleared.",
  },
  {
    key: "riskflag_invalid_phone",
    label: "Flag invalid phone numbers",
    hint: "Flag orders whose mobile is not a valid Pakistani format.",
  },
  {
    key: "riskflag_dup_cancelled",
    label: "Flag numbers with a previously cancelled order",
    hint: "Flag orders when the same mobile number had a cancelled order before.",
  },
  {
    key: "riskflag_refused_address",
    label: "Flag refused addresses",
    hint: "Flag orders whose delivery address matches an address you marked as refused.",
  },
];

const TEMPLATES: { key: string; label: string; hint: string }[] = [
  {
    key: "confirm_msg_customer",
    label: "Customer confirmation message",
    hint: "Pre-filled WhatsApp message the customer sends to you. Placeholders: {order_id}, {name}, {total}",
  },
  {
    key: "confirm_msg_admin",
    label: "Admin reminder message",
    hint: "Pre-filled WhatsApp message you send to the customer. Placeholders: {order_id}, {name}, {total}",
  },
];

export function ConfirmationSettingsForm({ initial }: { initial: Record<string, string> }) {
  const router = useRouter();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [values, setValues] = useState<Record<string, string>>(() => {
    const v: Record<string, string> = {};
    for (const t of [...TOGGLES, ...TEMPLATES]) v[t.key] = initial[t.key] ?? "";
    return v;
  });

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Save failed");
      toast("Confirmation settings saved");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card title="COD order confirmation">
      <form onSubmit={save} className="space-y-4">
        {error ? (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
        ) : null}
        <div className="space-y-3">
          {TOGGLES.map((t) => (
            <label key={t.key} className="flex items-start gap-3">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                checked={(values[t.key] ?? "1") !== "0"}
                onChange={(e) => setValues((v) => ({ ...v, [t.key]: e.target.checked ? "1" : "0" }))}
              />
              <span>
                <span className="block text-sm font-medium text-gray-800">{t.label}</span>
                <span className="block text-xs text-gray-500">{t.hint}</span>
              </span>
            </label>
          ))}
        </div>
        <div className="grid gap-4">
          {TEMPLATES.map((t) => (
            <Field key={t.key} label={t.label} hint={t.hint}>
              <textarea
                className={inputCls}
                rows={3}
                value={values[t.key] ?? ""}
                onChange={(e) => setValues((v) => ({ ...v, [t.key]: e.target.value }))}
              />
            </Field>
          ))}
        </div>
        <button type="submit" disabled={saving} className={btnPrimary}>
          {saving ? "Saving…" : "Save confirmation settings"}
        </button>
      </form>
    </Card>
  );
}

export function RefusedAddressesManager() {
  const { toast } = useToast();
  const [rows, setRows] = useState<{ id: string; address: string; city: string | null; note: string | null }[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);

  async function load() {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/refused-addresses");
      const data = (await res.json()) as { addresses?: typeof rows };
      setRows(data.addresses ?? []);
      setLoaded(true);
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/refused-addresses", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error("Delete failed");
      setRows((r) => r.filter((x) => x.id !== id));
      toast("Removed");
    } catch {
      toast("Delete failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card title="Refused addresses">
      <p className="mb-3 text-sm text-gray-600">
        New orders delivering to these addresses get a risk flag. Add entries from any order's
        “Confirmation & risk check” card.
      </p>
      {!loaded ? (
        <button className={btnSecondary} disabled={busy} onClick={load}>
          {busy ? "Loading…" : "Load refused addresses"}
        </button>
      ) : rows.length === 0 ? (
        <p className="text-sm text-gray-500">No refused addresses saved.</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((r) => (
            <li key={r.id} className="flex items-start justify-between gap-3 rounded-md border border-gray-200 px-3 py-2 text-sm">
              <span>
                <span className="font-medium text-gray-900">{r.address}</span>
                {r.city ? <span className="text-gray-500"> · {r.city}</span> : null}
                {r.note ? <span className="block text-xs text-gray-400">{r.note}</span> : null}
              </span>
              <button
                className="shrink-0 text-xs font-medium text-red-700 hover:underline"
                disabled={busy}
                onClick={() => remove(r.id)}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
