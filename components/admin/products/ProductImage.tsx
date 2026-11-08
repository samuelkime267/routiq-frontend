"use client";

import { useState } from "react";
import { Icon } from "@/components/icons";
import Modal from "@/components/ui/Modal";
import { cn } from "@/lib/cn";

interface ProductThumbnailProps {
  src?: string | null;
  name: string;
  className?: string;
  variant?: "thumb" | "tile";
}

/**
 * Catalogue thumbnail with an inline preview. Missing imagery falls back to the
 * same tinted well used by product cards elsewhere in the console.
 */
export function ProductThumbnail({
  src,
  name,
  className,
  variant = "thumb",
}: ProductThumbnailProps) {
  const [preview, setPreview] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => src && setPreview(true)}
        aria-label={src ? `Preview image for ${name}` : `${name} has no image`}
        className={cn(
          "grid shrink-0 place-items-center overflow-hidden border border-line bg-well text-muted transition",
          variant === "tile"
            ? "aspect-square w-full rounded-2xl"
            : "size-10 rounded-xl",
          src &&
            "hover:border-pri/30 focus-visible:ring-2 focus-visible:ring-pri/30 focus-visible:outline-none",
          className,
        )}
      >
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt=""
            className="size-full object-cover"
            loading="lazy"
          />
        ) : (
          <Icon
            name="package"
            className={variant === "tile" ? "size-7" : "size-4"}
          />
        )}
      </button>

      {preview && src ? (
        <Modal
          open
          onClose={() => setPreview(false)}
          title={name}
          description="Product image preview"
          size="lg"
        >
          <div className="grid min-h-[280px] place-items-center rounded-xl bg-well/60 p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={name}
              className="max-h-[65vh] w-auto max-w-full rounded-lg object-contain"
            />
          </div>
        </Modal>
      ) : null}
    </>
  );
}
