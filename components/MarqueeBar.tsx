"use client";

import { useId } from "react";

type MarqueeBarProps = {
  messages: string[];
  bgColor?: string;
  textColor?: string;
  fontSize?: number;
  speedSeconds?: number;
};

/**
 * Premium infinite-scrolling announcement marquee.
 * Seamless loop: content is duplicated and translated -50% with linear timing.
 */
export default function MarqueeBar({
  messages,
  bgColor,
  textColor,
  fontSize = 12,
  speedSeconds = 30,
}: MarqueeBarProps) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const animName = `skn-marquee-${uid}`;

  const items = messages.filter((m) => m.trim().length > 0);
  if (items.length === 0) return null;

  // Repeat the sequence enough times that one half always covers the viewport.
  const seq = [...items, ...items, ...items, ...items];

  return (
    <>
      <style>{`
        @keyframes ${animName} {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .${animName}-track {
          animation: ${animName} ${speedSeconds}s linear infinite;
          will-change: transform;
        }
        .${animName}-track:hover {
          animation-play-state: paused;
        }
        @media (prefers-reduced-motion: reduce) {
          .${animName}-track { animation: none; }
        }
      `}</style>
      <div
        role="marquee"
        aria-label={items.join(" • ")}
        className="overflow-hidden"
        style={{ backgroundColor: bgColor || "var(--color-primary)" }}
      >
        <div className={`${animName}-track flex w-max items-center whitespace-nowrap py-2`}>
          {[0, 1].map((half) => (
            <div key={half} className="flex items-center" aria-hidden={half === 1}>
              {seq.map((msg, i) => (
                <span
                  key={`${half}-${i}`}
                  className="inline-flex items-center"
                  style={{ color: textColor || "#ffffff", fontSize: `${fontSize}px` }}
                >
                  <span className="px-6 font-medium tracking-wide">{msg.trim()}</span>
                  <span aria-hidden="true" style={{ color: textColor || "#ffffff", opacity: 0.7 }}>
                    ✦
                  </span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
