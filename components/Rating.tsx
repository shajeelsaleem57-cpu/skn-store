import { IconStar } from "./Icons";

export default function Rating({
  value,
  count,
  size = 14,
}: {
  value: number;
  count?: number;
  size?: number;
}) {
  const pct = Math.max(0, Math.min(100, (value / 5) * 100));
  const star = (filled: boolean) => (
    <span
      aria-hidden="true"
      className="inline-block shrink-0"
      style={{ width: size, height: size }}
    >
      <IconStar className={`h-full w-full ${filled ? "text-accent" : "text-border"}`} />
    </span>
  );

  return (
    <span
      className="inline-flex items-center gap-1.5"
      role="img"
      aria-label={`Rated ${value.toFixed(1)} out of 5${
        count !== undefined ? ` based on ${count} reviews` : ""
      }`}
    >
      <span className="relative inline-flex">
        <span className="flex gap-0.5">
          {[0, 1, 2, 3, 4].map((i) => (
            <span key={i}>{star(false)}</span>
          ))}
        </span>
        <span
          className="absolute inset-0 overflow-hidden"
          style={{ width: `${pct}%` }}
        >
          <span className="flex w-max gap-0.5">
            {[0, 1, 2, 3, 4].map((i) => (
              <span key={i}>{star(true)}</span>
            ))}
          </span>
        </span>
      </span>
      {count !== undefined && (
        <span className="text-xs text-muted">({count})</span>
      )}
    </span>
  );
}
