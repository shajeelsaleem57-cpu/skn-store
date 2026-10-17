"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/Toast";
import { IconAlert, IconCheck } from "@/components/Icons";

const inputCls =
  "w-full rounded border border-border px-3 py-2.5 text-sm text-ink focus:border-primary focus:outline-none";

export default function ResetPasswordPage({ params }: { params: { token: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    if (password !== confirm) return setError("Passwords do not match.");
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: params.token, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not reset your password.");
      setDone(true);
      toast("Password updated");
      setTimeout(() => router.push("/login"), 2000);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "This reset link is invalid or has expired. Please request a new one."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-md px-4 py-12">
      <div className="rounded border border-border bg-card p-8">
        <h1 className="text-2xl font-bold text-ink">Set a new password</h1>
        {done ? (
          <p className="mt-4 flex items-start gap-2 text-sm text-ink">
            <span className="mt-0.5 text-success">
              <IconCheck />
            </span>
            Your password has been updated. Taking you to the login page…
          </p>
        ) : (
          <>
            <p className="mt-1 text-sm text-muted">Choose a new password for your account.</p>
            <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
              <div>
                <label htmlFor="rp-password" className="mb-1 block text-sm font-medium text-ink">
                  New password
                </label>
                <input
                  id="rp-password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputCls}
                  placeholder="At least 8 characters"
                />
              </div>
              <div>
                <label htmlFor="rp-confirm" className="mb-1 block text-sm font-medium text-ink">
                  Confirm new password
                </label>
                <input
                  id="rp-confirm"
                  type="password"
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className={inputCls}
                  placeholder="Repeat your password"
                />
              </div>
              {error ? (
                <p className="flex items-center gap-2 text-sm text-error">
                  <IconAlert /> {error}
                </p>
              ) : null}
              <button
                type="submit"
                disabled={loading}
                className="rounded bg-primary px-6 py-3 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
              >
                {loading ? "Updating…" : "Update password"}
              </button>
            </form>
            <Link
              href="/forgot-password"
              className="mt-6 inline-block text-sm font-medium text-primary hover:underline"
            >
              Request a new reset link
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
