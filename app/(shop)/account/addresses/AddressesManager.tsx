"use client";

import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/components/Toast";
import { IconTrash, IconPlus, IconCheck } from "@/components/Icons";
import { PROVINCES } from "@/lib/constants";
import { isValidPakistaniMobile } from "@/lib/utils";

type Address = {
  id: string;
  label: string;
  fullName: string;
  mobile: string;
  address: string;
  city: string;
  province: string;
  postalCode: string | null;
  isDefault: boolean;
};

const EMPTY = {
  label: "Home",
  fullName: "",
  mobile: "",
  address: "",
  city: "",
  province: "",
  postalCode: "",
  isDefault: false,
};

const inputCls =
  "w-full rounded border border-border px-3 py-2 text-sm text-ink focus:border-primary focus:outline-none";

export default function AddressesManager() {
  const { toast } = useToast();
  const [addresses, setAddresses] = useState<Address[] | null>(null);
  const [editing, setEditing] = useState<(typeof EMPTY & { id?: string }) | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/account/addresses");
    if (res.ok) {
      const data = await res.json();
      setAddresses(data.addresses as Address[]);
    } else {
      setAddresses([]);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const validate = (a: typeof EMPTY): boolean => {
    if (a.fullName.trim().length < 3) return setError("Please enter the full name."), false;
    if (!isValidPakistaniMobile(a.mobile))
      return setError("Enter a valid Pakistani mobile number."), false;
    if (a.address.trim().length < 5) return setError("Please enter the complete address."), false;
    if (a.city.trim().length < 2) return setError("Please enter the city."), false;
    if (!a.province) return setError("Please select the province."), false;
    setError("");
    return true;
  };

  const save = async () => {
    if (!editing || !validate(editing)) return;
    setSaving(true);
    try {
      const method = editing.id ? "PUT" : "POST";
      const res = await fetch("/api/account/addresses", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editing),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not save the address.");
      setEditing(null);
      toast(editing.id ? "Address updated" : "Address added");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the address.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this address?")) return;
    const res = await fetch(`/api/account/addresses?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    if (res.ok) {
      toast("Address deleted");
      load();
    } else {
      toast("Could not delete the address.");
    }
  };

  const setDefault = async (a: Address) => {
    const res = await fetch("/api/account/addresses", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...a, isDefault: true }),
    });
    if (res.ok) {
      toast("Default address updated");
      load();
    } else {
      toast("Could not update the default address.");
    }
  };

  if (addresses === null) {
    return <p className="py-8 text-center text-sm text-muted">Loading addresses…</p>;
  }

  return (
    <div>
      {addresses.length === 0 && !editing ? (
        <div className="rounded border border-border bg-card p-8 text-center">
          <p className="text-sm font-semibold text-ink">No saved addresses</p>
          <p className="mt-1 text-sm text-muted">Add an address to speed up checkout.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {addresses.map((a) => (
            <div key={a.id} className="rounded border border-border bg-card p-5">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-bold text-ink">
                  {a.label}
                  {a.isDefault ? (
                    <span className="ml-2 inline-flex items-center gap-1 rounded bg-soft-bg px-2 py-0.5 text-xs font-medium text-success">
                      <IconCheck /> Default
                    </span>
                  ) : null}
                </p>
                <button
                  type="button"
                  onClick={() => remove(a.id)}
                  aria-label="Delete address"
                  className="rounded p-1 text-muted hover:text-error"
                >
                  <IconTrash />
                </button>
              </div>
              <p className="mt-2 text-sm font-medium text-ink">{a.fullName}</p>
              <p className="text-sm text-muted">{a.address}</p>
              <p className="text-sm text-muted">
                {a.city}, {a.province}
                {a.postalCode ? ` ${a.postalCode}` : ""}
              </p>
              <p className="text-sm text-muted">{a.mobile}</p>
              <div className="mt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setEditing({ ...a, postalCode: a.postalCode || "" })}
                  className="text-sm font-semibold text-primary hover:underline"
                >
                  Edit
                </button>
                {!a.isDefault ? (
                  <button
                    type="button"
                    onClick={() => setDefault(a)}
                    className="text-sm font-semibold text-primary hover:underline"
                  >
                    Set as default
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}

      {!editing ? (
        <button
          type="button"
          onClick={() => {
            setError("");
            setEditing({ ...EMPTY });
          }}
          className="mt-4 inline-flex items-center gap-2 rounded border border-primary px-5 py-2.5 text-sm font-semibold text-primary hover:bg-soft-bg"
        >
          <IconPlus /> Add new address
        </button>
      ) : (
        <div className="mt-4 rounded border border-border bg-card p-6">
          <h2 className="mb-4 text-base font-bold text-ink">
            {editing.id ? "Edit address" : "Add new address"}
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">Label</label>
              <input
                value={editing.label}
                onChange={(e) => setEditing({ ...editing, label: e.target.value })}
                className={inputCls}
                placeholder="Home, Office…"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">Full name *</label>
              <input
                value={editing.fullName}
                onChange={(e) => setEditing({ ...editing, fullName: e.target.value })}
                className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">Mobile *</label>
              <input
                value={editing.mobile}
                onChange={(e) => setEditing({ ...editing, mobile: e.target.value })}
                className={inputCls}
                inputMode="tel"
                placeholder="0328 7533227"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">City *</label>
              <input
                value={editing.city}
                onChange={(e) => setEditing({ ...editing, city: e.target.value })}
                className={inputCls}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-ink">Address *</label>
              <textarea
                value={editing.address}
                onChange={(e) => setEditing({ ...editing, address: e.target.value })}
                rows={2}
                className={inputCls}
                placeholder="House, street, area…"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">Province *</label>
              <select
                value={editing.province}
                onChange={(e) => setEditing({ ...editing, province: e.target.value })}
                className={inputCls}
              >
                <option value="">Select province</option>
                {PROVINCES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">Postal code</label>
              <input
                value={editing.postalCode}
                onChange={(e) => setEditing({ ...editing, postalCode: e.target.value })}
                className={inputCls}
                inputMode="numeric"
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-ink sm:col-span-2">
              <input
                type="checkbox"
                checked={editing.isDefault}
                onChange={(e) => setEditing({ ...editing, isDefault: e.target.checked })}
                className="accent-black"
              />
              Set as default address
            </label>
          </div>
          {error ? <p className="mt-3 text-sm text-error">{error}</p> : null}
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="rounded bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
            >
              {saving ? "Saving…" : editing.id ? "Save changes" : "Add address"}
            </button>
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="rounded border border-border px-6 py-2.5 text-sm font-semibold text-ink"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
