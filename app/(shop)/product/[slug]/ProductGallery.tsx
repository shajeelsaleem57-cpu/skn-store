"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

export default function ProductGallery({
  images,
  title,
}: {
  images: string[];
  title: string;
}) {
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState(false);

  if (images.length === 0) {
    return (
      <div className="flex aspect-square w-full items-center justify-center rounded border border-border bg-soft-bg text-sm text-muted">
        No image available
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div
        className="relative aspect-square w-full cursor-zoom-in overflow-hidden rounded border border-border bg-soft-bg"
        onMouseEnter={() => setZoom(true)}
        onMouseLeave={() => setZoom(false)}
      >
        <Image
          src={images[active]}
          alt={title}
          fill
          priority
          className={cn(
            "object-cover transition-transform duration-300",
            zoom && "scale-150"
          )}
          sizes="(max-width: 1024px) 100vw, 50vw"
        />
      </div>
      {images.length > 1 ? (
        <div className="grid grid-cols-5 gap-2">
          {images.map((src, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`View image ${i + 1}`}
              className={cn(
                "relative aspect-square overflow-hidden rounded border bg-soft-bg",
                i === active ? "border-primary ring-1 ring-primary" : "border-border"
              )}
            >
              <Image
                src={src}
                alt={`${title} — image ${i + 1}`}
                fill
                className="object-cover"
                sizes="96px"
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
