"use client";

import { useState } from "react";
import { useToast } from "@/components/Toast";
import { IconAlert } from "@/components/Icons";

const inputCls =
  "w-full rounded border border-border px-3 py-2.5 text-sm text-ink focus:border-primary focus:outline-none";

export default function ContactForm() {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) return setError("Please enter your name.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      return setError("Please enter a valid email address.");
    if (message.trim().length < 10)
      return setError("Please write a message of at least 10 characters.");
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), message: message.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not send your message.");
      setSent(true);
      toast("Message sent — we will get back to you soon.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send your message.");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="rounded border border-border bg-soft-bg p-8 text-center">
        <p className="text-sm font-semibold text-ink">Message received</p>
        <p className="mt-1 text-sm text-muted">
          Thank you for reaching out. Our team will reply to your email shortly.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4 rounded border border-border bg-card p-6">
      <h2 className="text-base font-bold text-ink">Send us a message</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="ct-name" className="mb-1 block text-sm font-medium text-ink">
            Name
          </label>
          <input
            id="ct-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputCls}
            placeholder="Your name"
          />
        </div>
        <div>
          <label htmlFor="ct-email" className="mb-1 block text-sm font-medium text-ink">
            Email
          </label>
          <input
            id="ct-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputCls}
            placeholder="you@example.com"
          />
        </div>
      </div>
      <div>
        <label htmlFor="ct-message" className="mb-1 block text-sm font-medium text-ink">
          Message
        </label>
        <textarea
          id="ct-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={5}
          className={inputCls}
          placeholder="How can we help?"
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
        className="self-start rounded bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
      >
        {loading ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
