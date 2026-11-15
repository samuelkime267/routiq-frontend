"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import CatalogControls, {
  type CatalogFilterState,
} from "@/components/marketplace/CatalogControls";
import MarketplaceContainer from "@/components/marketplace/MarketplaceContainer";
import MarketplaceMedia from "@/components/marketplace/MarketplaceMedia";
import ProductGrid, {
  ProductGridSkeleton,
} from "@/components/marketplace/ProductGrid";
import { Icon } from "@/components/icons";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import Pagination from "@/components/ui/Pagination";
import Skeleton from "@/components/ui/Skeleton";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import {
  useMarketplaceStore,
  useMarketplaceStoreProducts,
} from "@/hooks/useMarketplace";
import {
  initials,
  parseCatalogSort,
  sortQuery,
  storeLocation,
  todayHours,
} from "@/lib/marketplace";
import type { MarketplaceProductQuery } from "@/types/api";

const PAGE_SIZE = 12;

export default function StoreDetail({ storeId }: { storeId: string }) {
  const { data, loading, error, reload } = useMarketplaceStore(storeId);
  const [filters, setFilters] = useState<CatalogFilterState>({
    search: "",
    category: "",
    availability: "",
    sort: parseCatalogSort("featured"),
    minPrice: "",
    maxPrice: "",
  });
  const [pageState, setPageState] = useState({ key: "", page: 1 });

  const debouncedSearch = useDebouncedValue(filters.search, 350);
  const debouncedMin = useDebouncedValue(filters.minPrice, 500);
  const debouncedMax = useDebouncedValue(filters.maxPrice, 500);

  // Resetting the page whenever a filter changes is derived state: the page
  // only counts while the filter signature it belongs to is unchanged.
  const filterKey = [
    storeId,
    debouncedSearch,
    filters.availability,
    filters.sort,
    debouncedMin,
    debouncedMax,
  ].join("|");
  const page = pageState.key === filterKey ? pageState.page : 1;
  const setPage = (nextPage: number) =>
    setPageState({ key: filterKey, page: nextPage });

  const productQuery = useMemo<MarketplaceProductQuery>(
    () => ({
      search: debouncedSearch.trim() || undefined,
      availability: filters.availability || undefined,
      minPrice: debouncedMin ? Number(debouncedMin) : undefined,
      maxPrice: debouncedMax ? Number(debouncedMax) : undefined,
      ...sortQuery(filters.sort),
      page,
      limit: PAGE_SIZE,
    }),
    [
      debouncedSearch,
      filters.availability,
      filters.sort,
      debouncedMin,
      debouncedMax,
      page,
    ],
  );

  const productResource = useMarketplaceStoreProducts(storeId, productQuery);
  const store = data?.store ?? null;
  const products = productResource.data?.products ?? [];
  const hours = store ? todayHours(store) : null;

  if (loading) {
    return (
      <MarketplaceContainer className="py-6 sm:py-8 lg:py-10">
        <Skeleton className="h-40 w-full rounded-[24px] sm:h-56" />
        <div className="mt-5 space-y-3">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-3 w-96 max-w-full" />
        </div>
        <div className="mt-8">
          <ProductGridSkeleton count={4} />
        </div>
      </MarketplaceContainer>
    );
  }

  if (error || !store) {
    return (
      <MarketplaceContainer className="py-10 sm:py-14">
        <ErrorState
          title="We could not load this store"
          description={
            error ??
            "This store may have been removed or is no longer active."
          }
          onRetry={reload}
          action={
            <Button href="/stores" size="sm" variant="outline">
              Browse all stores
            </Button>
          }
          className="bg-white"
        />
      </MarketplaceContainer>
    );
  }

  const patchFilters = (patch: Partial<CatalogFilterState>) => {
    setFilters((current) => ({ ...current, ...patch }));
  };

  return (
    <MarketplaceContainer className="py-6 sm:py-8 lg:py-10">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Stores", href: "/stores" },
          { label: store.name },
        ]}
        className="mb-4"
      />

      <div className="overflow-hidden rounded-[24px] border border-line bg-white">
        <MarketplaceMedia
          src={store.coverImage}
          alt={`${store.name} storefront`}
          icon="store"
          priority
          className="h-40 sm:h-56"
          sizes="(max-width: 1180px) 100vw, 1180px"
        />
        <div className="px-4 pb-5 sm:px-6 sm:pb-6">
          <div className="-mt-9 flex items-end justify-between gap-4 sm:-mt-10">
            <span className="grid size-[72px] shrink-0 place-items-center overflow-hidden rounded-[20px] border-4 border-white bg-pri text-lg font-bold text-lime shadow-sm sm:size-20">
              {store.logo ? (
                <MarketplaceMedia
                  compact
                  src={store.logo}
                  alt={`${store.name} logo`}
                  icon="store"
                  fit="contain"
                  className="size-full"
                  sizes="80px"
                />
              ) : (
                initials(store.name)
              )}
            </span>
            <Badge tone="teal" className="mb-1">
              {store.category}
            </Badge>
          </div>

          <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-[620px]">
              <h1 className="text-[24px] leading-tight font-semibold tracking-[-0.035em] text-ink sm:text-[30px]">
                {store.name}
              </h1>
              <p className="mt-2 text-[12px] leading-relaxed text-muted sm:text-[13px]">
                {store.description ||
                  `Shop ${store.category.toLowerCase()} from ${store.name}.`}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-soft px-3 py-1.5 text-[10.5px] font-medium text-muted">
                <Icon name="map-pin" className="size-3.5 text-pri" />
                {storeLocation(store) || "Nigeria"}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-soft px-3 py-1.5 text-[10.5px] font-medium text-muted">
                <Icon name="shopping-bag" className="size-3.5 text-pri" />
                {store.productCount}{" "}
                {store.productCount === 1 ? "product" : "products"}
              </span>
              {hours ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-soft px-3 py-1.5 text-[10.5px] font-medium text-muted">
                  <Icon name="clock" className="size-3.5 text-pri" />
                  {hours.label}
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-line bg-white p-4">
          <Icon name="clock" className="size-4 text-pri" />
          <p className="mt-2 text-[9px] font-semibold tracking-[0.14em] text-muted uppercase">
            Today
          </p>
          <p className="mt-1 text-[12px] font-semibold text-ink">
            {hours?.label ?? "Opening hours unavailable"}
          </p>
        </div>
        <div className="rounded-2xl border border-line bg-white p-4">
          <Icon name="map-pin" className="size-4 text-pri" />
          <p className="mt-2 text-[9px] font-semibold tracking-[0.14em] text-muted uppercase">
            Pickup
          </p>
          <p className="mt-1 line-clamp-2 text-[12px] font-semibold text-ink">
            {store.pickupInstructions ||
              store.address?.street ||
              "Contact the store for pickup details"}
          </p>
        </div>
        <div className="rounded-2xl border border-line bg-white p-4">
          <Icon name="truck" className="size-4 text-pri" />
          <p className="mt-2 text-[9px] font-semibold tracking-[0.14em] text-muted uppercase">
            Delivery
          </p>
          <p className="mt-1 text-[12px] font-semibold text-ink">
            Coordinated after your order is confirmed
          </p>
        </div>
      </div>

      <div className="mt-8 flex items-end justify-between gap-4">
        <div>
          <p className="text-[9.5px] font-semibold tracking-[0.16em] text-pri/55 uppercase">
            Store catalogue
          </p>
          <h2 className="mt-1 text-[21px] font-semibold tracking-[-0.03em] text-ink sm:text-[25px]">
            Products from {store.name}
          </h2>
        </div>
        <Link
          href="/products"
          className="hidden rounded-full border border-line px-4 py-2 text-[11px] font-semibold text-pri transition hover:bg-well sm:inline-flex"
        >
          All products
        </Link>
      </div>

      <div className="mt-4">
        <CatalogControls
          value={filters}
          onChange={patchFilters}
          categories={[]}
          hideCategory
        />
      </div>

      <div className="mt-4 flex items-center justify-between">
        <p className="text-[11px] text-muted">
          {productResource.loading
            ? "Loading products…"
            : `${productResource.data?.pagination.total ?? 0} ${productResource.data?.pagination.total === 1 ? "product" : "products"} in this store`}
        </p>
      </div>

      <div className="mt-3">
        {productResource.loading ? (
          <ProductGridSkeleton count={PAGE_SIZE} />
        ) : productResource.error ? (
          <ErrorState
            compact
            description={productResource.error}
            onRetry={productResource.reload}
            className="bg-white"
          />
        ) : products.length === 0 ? (
          <EmptyState
            icon="shopping-bag"
            title="No products match this view"
            description="Try clearing the filters or check back as the store adds stock."
          />
        ) : (
          <ProductGrid products={products} priorityCount={4} />
        )}
      </div>

      {productResource.data && productResource.data.pagination.total > 0 ? (
        <Pagination
          meta={productResource.data.pagination}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
          itemLabel="products"
          className="mt-6 rounded-2xl border border-line bg-white"
        />
      ) : null}
    </MarketplaceContainer>
  );
}
