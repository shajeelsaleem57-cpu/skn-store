"use client";

import { useState } from "react";
import { Card, Field, btnPrimary, inputCls } from "../../_components/ui";
import { useToast } from "../../_components/toast";

export function ChangePasswordForm() {
  const { toast } = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Failed to change password.");
      toast("Password changed successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to change password.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <h2 className="mb-1 text-lg font-bold">Change Password</h2>
      <p className="mb-4 text-sm text-muted">Update your admin account password.</p>
      <form onSubmit={submit} className="max-w-md space-y-4">
        <Field label="Current password">
          <input
            type="password"
            className={inputCls}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </Field>
        <Field label="New password (min 8 characters)">
          <input
            type="password"
            className={inputCls}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
          />
        </Field>
        <Field label="Confirm new password">
          <input
            type="password"
            className={inputCls}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            autoComplete="new-password"
          />
        </Field>
        {error ? <p className="text-sm text-error">{error}</p> : null}
        <button type="submit" className={btnPrimary} disabled={saving}>
          {saving ? "Saving…" : "Change Password"}
        </button>
      </form>
    </Card>
  );
}
