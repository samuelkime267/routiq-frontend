import Link from "next/link";
import MarketplaceMedia from "@/components/marketplace/MarketplaceMedia";
import { Icon } from "@/components/icons";
import Badge from "@/components/ui/Badge";
import { cn } from "@/lib/cn";
import { initials, storeLocation } from "@/lib/marketplace";
import type { MarketplaceStore } from "@/types/api";

export default function StoreCard({
  store,
  className,
}: {
  store: MarketplaceStore;
  className?: string;
}) {
  return (
    <article
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-[20px] border border-line bg-white transition duration-200 hover:-translate-y-0.5 hover:border-pri/20 hover:shadow-[0_14px_36px_rgba(6,76,80,0.08)] motion-reduce:transition-none motion-reduce:hover:translate-y-0",
        className,
      )}
    >
      <Link
        href={`/stores/${store._id}`}
        aria-label={`Explore ${store.name}`}
        className="relative block overflow-hidden focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pri/20"
      >
        <MarketplaceMedia
          src={store.coverImage}
          alt={`${store.name} storefront`}
          icon="store"
          zoom
          className="h-28 sm:h-32"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 380px"
        />
        <span
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-pri-deep/35 via-transparent to-transparent"
        />
        <Badge
          tone="lime"
          className="absolute top-3 left-3 max-w-[70%] truncate px-2.5 py-1 text-[9.5px]"
        >
          {store.category}
        </Badge>
      </Link>

      <div className="relative flex flex-1 flex-col px-4 pb-4">
        <div className="-mt-7 flex items-end justify-between gap-3">
          <span className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-2xl border-[3px] border-white bg-pri text-sm font-bold text-lime shadow-sm">
            {store.logo ? (
              <MarketplaceMedia
                compact
                src={store.logo}
                alt={`${store.name} logo`}
                icon="store"
                fit="contain"
                className="size-full"
                sizes="56px"
              />
            ) : (
              initials(store.name)
            )}
          </span>

          <span className="mb-1 text-[10px] font-medium text-muted">
            {store.productCount}{" "}
            {store.productCount === 1 ? "product" : "products"}
          </span>
        </div>

        <h3 className="mt-3 text-[14px] font-semibold tracking-tight text-ink">
          <Link
            href={`/stores/${store._id}`}
            className="rounded transition hover:text-pri focus-visible:ring-2 focus-visible:ring-pri/30 focus-visible:outline-none"
          >
            {store.name}
          </Link>
        </h3>

        <p className="mt-1.5 line-clamp-2 text-[11.5px] leading-relaxed text-muted">
          {store.description ||
            `Shop ${store.category.toLowerCase()} from ${store.name}.`}
        </p>

        <div className="mt-auto flex items-center justify-between gap-3 pt-4">
          <span className="inline-flex min-w-0 items-center gap-1 text-[10.5px] text-muted">
            <Icon name="map-pin" className="size-3 shrink-0" />
            <span className="truncate">{storeLocation(store) || "Nigeria"}</span>
          </span>

          <Link
            href={`/stores/${store._id}`}
            className="inline-flex shrink-0 items-center gap-1 rounded text-[10.5px] font-semibold text-pri transition hover:gap-1.5 focus-visible:ring-2 focus-visible:ring-pri/30 focus-visible:outline-none"
          >
            Explore store
            <Icon name="arrow-right" className="size-3" />
          </Link>
        </div>
      </div>
    </article>
  );
}
