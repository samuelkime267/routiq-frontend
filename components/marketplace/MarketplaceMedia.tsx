/* eslint-disable @next/next/no-img-element */
import Image from "next/image";
import { Icon, type IconName } from "@/components/icons";
import { cn } from "@/lib/cn";
import { isOptimizableImage } from "@/lib/marketplace";

interface MarketplaceMediaProps {
  src?: string | null;
  alt: string;
  icon?: IconName;
  sizes?: string;
  priority?: boolean;
  fit?: "cover" | "contain";
  zoom?: boolean;
  compact?: boolean;
  className?: string;
  imageClassName?: string;
}

/**
 * Image well shared by marketplace cards.
 *
 * Product photography is optional in the catalogue, so a composed placeholder
 * keeps grids balanced when a store has not uploaded media yet.
 */
export default function MarketplaceMedia({
  src,
  alt,
  icon = "image",
  sizes = "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 280px",
  priority = false,
  fit = "cover",
  zoom = false,
  compact = false,
  className,
  imageClassName,
}: MarketplaceMediaProps) {
  const imageClasses = cn(
    fit === "cover" ? "object-cover" : "object-contain",
    zoom &&
      "transition duration-500 ease-out group-hover:scale-[1.035] motion-reduce:transition-none",
    imageClassName,
  );

  return (
    <div className={cn("relative overflow-hidden bg-well", className)}>
      {src ? (
        isOptimizableImage(src) ? (
          <Image
            src={src}
            alt={alt}
            fill
            sizes={sizes}
            priority={priority}
            className={imageClasses}
          />
        ) : (
          <img
            src={src}
            alt={alt}
            loading={priority ? "eager" : "lazy"}
            decoding="async"
            className={cn("absolute inset-0 size-full", imageClasses)}
          />
        )
      ) : (
        <div className="absolute inset-0 grid place-items-center bg-[linear-gradient(135deg,#edf2f2_0%,#f8fbfa_58%,#ffefd0_100%)]">
          <div className="flex flex-col items-center gap-2 text-pri/35">
            <span
              className={cn(
                "grid place-items-center rounded-2xl border border-pri/10 bg-white/55",
                compact ? "size-7" : "size-11",
              )}
            >
              <Icon name={icon} className={compact ? "size-3.5" : "size-5"} />
            </span>
            {compact ? null : (
              <span className="text-[9px] font-semibold tracking-[0.18em] uppercase">
                Routiq
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
