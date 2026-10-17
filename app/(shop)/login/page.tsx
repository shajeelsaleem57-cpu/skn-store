"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useToast } from "@/components/Toast";
import { IconAlert } from "@/components/Icons";

const inputCls =
  "w-full rounded border border-border px-3 py-2.5 text-sm text-ink focus:border-primary focus:outline-none";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const callbackUrl = searchParams.get("callbackUrl") || "";
  const isAdmin = searchParams.get("admin") === "1";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const result = await signIn("credentials", {
        redirect: false,
        email: email.trim().toLowerCase(),
        password,
      });
      if (!result || result.error || !result.ok) {
        setError("Invalid email or password. Please try again.");
        return;
      }
      toast("Logged in successfully");
      // Admin logins (e.g. redirected from /admin) go to the admin dashboard.
      if (isAdmin) router.push("/admin");
      else if (callbackUrl.startsWith("/")) router.push(callbackUrl);
      else router.push("/account");
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-md px-4 py-12">
      <div className="rounded border border-border bg-card p-8">
        <h1 className="text-2xl font-bold text-ink">
          {isAdmin ? "Admin login" : "Log in"}
        </h1>
        <p className="mt-1 text-sm text-muted">
          {isAdmin
            ? "Sign in with your admin account to continue."
            : "Welcome back! Log in to track orders and manage your account."}
        </p>

        <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
          <div>
            <label htmlFor="login-email" className="mb-1 block text-sm font-medium text-ink">
              Email
            </label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputCls}
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label htmlFor="login-password" className="mb-1 block text-sm font-medium text-ink">
              Password
            </label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputCls}
              placeholder="••••••••"
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
            {loading ? "Logging in…" : "Log in"}
          </button>
        </form>

        <div className="mt-6 flex items-center justify-between text-sm">
          <Link href="/forgot-password" className="font-medium text-primary hover:underline">
            Forgot password?
          </Link>
          {!isAdmin ? (
            <Link
              href={`/register${callbackUrl ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`}
              className="font-medium text-primary hover:underline"
            >
              Create account
            </Link>
          ) : null}
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-md px-4 py-12">
          <div className="rounded border border-border bg-card p-8">
            <p className="text-sm text-muted">Loading…</p>
          </div>
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
