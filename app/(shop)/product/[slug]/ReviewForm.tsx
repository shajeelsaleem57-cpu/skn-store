"use client";

import { useState } from "react";
import { useToast } from "@/components/Toast";
import { IconStar } from "@/components/Icons";
import { cn } from "@/lib/utils";

export default function ReviewForm({ productId }: { productId: string }) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) return toast("Please enter your name.");
    if (text.trim().length < 10) return toast("Please write at least a few words about the product.");
    setLoading(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, name: name.trim(), rating, text: text.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not submit your review.");
      setDone(true);
      toast("Thank you! Your review was submitted for approval.");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Could not submit your review.");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="rounded border border-border bg-soft-bg p-6 text-center">
        <p className="text-sm font-semibold text-ink">Review submitted</p>
        <p className="mt-1 text-sm text-muted">
          Thank you for your feedback. Your review will appear here after approval.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4 rounded border border-border bg-card p-6">
      <h3 className="text-base font-bold text-ink">Write a review</h3>
      <div>
        <label htmlFor="rv-name" className="mb-1 block text-sm font-medium text-ink">
          Your name
        </label>
        <input
          id="rv-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded border border-border px-3 py-2 text-sm text-ink"
          placeholder="e.g. Ahmed"
        />
      </div>
      <div>
        <p className="mb-1 text-sm font-medium text-ink">Rating</p>
        <div className="flex items-center gap-2" role="radiogroup" aria-label="Rating">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={rating === n}
              aria-label={`${n} star${n > 1 ? "s" : ""}`}
              onClick={() => setRating(n)}
              className={cn("rounded p-1 transition", n <= rating ? "text-accent" : "text-border hover:text-muted")}
            >
              <IconStar />
            </button>
          ))}
          <span className="text-sm text-muted">{rating}/5</span>
        </div>
      </div>
      <div>
        <label htmlFor="rv-text" className="mb-1 block text-sm font-medium text-ink">
          Your review
        </label>
        <textarea
          id="rv-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          className="w-full rounded border border-border px-3 py-2 text-sm text-ink"
          placeholder="What did you like about this product?"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="self-start rounded bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
      >
        {loading ? "Submitting…" : "Submit review"}
      </button>
    </form>
  );
}
