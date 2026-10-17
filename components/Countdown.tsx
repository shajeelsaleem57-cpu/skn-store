"use client";

import { useEffect, useState } from "react";

const pad = (n: number) => String(n).padStart(2, "0");

export default function Countdown({ endsAt }: { endsAt: string }) {
  const target = new Date(endsAt).getTime();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);

  if (Number.isNaN(target)) return null;
  const diff = target - now;
  if (diff <= 0) return null;

  const cells: Array<[string, string]> = [
    [pad(Math.floor(diff / 86_400_000)), "Days"],
    [pad(Math.floor(diff / 3_600_000) % 24), "Hrs"],
    [pad(Math.floor(diff / 60_000) % 60), "Min"],
    [pad(Math.floor(diff / 1_000) % 60), "Sec"],
  ];

  return (
    <div
      className="flex items-center gap-1.5"
      role="timer"
      aria-label="Offer ends in"
    >
      {cells.map(([v, label], i) => (
        <span key={label} className="flex items-center gap-1.5">
          <span className="flex min-w-11 flex-col items-center rounded-lg bg-primary px-1.5 py-1 text-white">
            <span className="text-sm font-bold tabular-nums leading-none">{v}</span>
            <span className="mt-0.5 text-[10px] uppercase leading-none opacity-70">
              {label}
            </span>
          </span>
          {i < cells.length - 1 && (
            <span aria-hidden="true" className="font-bold text-muted">
              :
            </span>
          )}
        </span>
      ))}
    </div>
  );
}
