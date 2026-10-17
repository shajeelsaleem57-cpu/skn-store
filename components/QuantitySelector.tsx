"use client";

import { IconMinus, IconPlus } from "./Icons";
import { cn } from "@/lib/utils";

export default function QuantitySelector({
  value,
  onChange,
  min = 1,
  max = 99,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}) {
  const dec = () => onChange(Math.max(min, value - 1));
  const inc = () => onChange(Math.min(max, value + 1));

  const btn =
    "flex h-8 w-8 items-center justify-center rounded-lg text-ink transition-colors hover:bg-soft-bg disabled:cursor-not-allowed disabled:opacity-30";

  return (
    <div
      className="inline-flex items-center gap-1 rounded-lg border border-border"
      role="group"
      aria-label="Quantity"
    >
      <button
        type="button"
        onClick={dec}
        disabled={value <= min}
        aria-label="Decrease quantity"
        className={cn(btn)}
      >
        <IconMinus className="h-4 w-4" />
      </button>
      <span
        aria-live="polite"
        aria-label={`Quantity ${value}`}
        className="min-w-8 text-center text-sm font-semibold text-ink"
      >
        {value}
      </span>
      <button
        type="button"
        onClick={inc}
        disabled={value >= max}
        aria-label="Increase quantity"
        className={cn(btn)}
      >
        <IconPlus className="h-4 w-4" />
      </button>
    </div>
  );
}
