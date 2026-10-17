"use client";

import { useState } from "react";
import Link from "next/link";
import { useToast } from "@/components/Toast";
import { IconAlert, IconCheck } from "@/components/Icons";

const inputCls =
  "w-full rounded border border-border px-3 py-2.5 text-sm text-ink focus:border-primary focus:outline-none";

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      // Always show success — the API never reveals whether the email exists.
      setSent(true);
      toast("Reset link sent");
    } catch {
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-md px-4 py-12">
      <div className="rounded border border-border bg-card p-8">
        <h1 className="text-2xl font-bold text-ink">Forgot password</h1>
        {sent ? (
          <div className="mt-4">
            <p className="flex items-start gap-2 text-sm text-ink">
              <span className="mt-0.5 text-success">
                <IconCheck />
              </span>
              If an account exists for <span className="font-semibold">{email}</span>, a password
              reset link has been sent to it. Please check your inbox (and spam folder).
            </p>
            <Link
              href="/login"
              className="mt-6 inline-block text-sm font-medium text-primary hover:underline"
            >
              Back to login
            </Link>
          </div>
        ) : (
          <>
            <p className="mt-1 text-sm text-muted">
              Enter your account email and we will send you a password reset link.
            </p>
            <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
              <div>
                <label htmlFor="fp-email" className="mb-1 block text-sm font-medium text-ink">
                  Email
                </label>
                <input
                  id="fp-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputCls}
                  placeholder="you@example.com"
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
                {loading ? "Sending…" : "Send reset link"}
              </button>
            </form>
            <Link
              href="/login"
              className="mt-6 inline-block text-sm font-medium text-primary hover:underline"
            >
              Back to login
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
