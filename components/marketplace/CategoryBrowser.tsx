"use client";

import { useMemo, useState } from "react";
import CatalogControls, {
  type CatalogFilterState,
} from "@/components/marketplace/CatalogControls";
import MarketplaceContainer from "@/components/marketplace/MarketplaceContainer";
import ProductGrid, {
  ProductGridSkeleton,
} from "@/components/marketplace/ProductGrid";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useMarketplaceCategoryProducts } from "@/hooks/useMarketplace";
import { formatNaira } from "@/lib/format";
import {
  categoryIcon,
  categoryTint,
  parseCatalogSort,
  sortQuery,
  type CatalogSort,
} from "@/lib/marketplace";
import type { MarketplaceProductQuery } from "@/types/api";
import { Icon } from "@/components/icons";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import PageHeader from "@/components/ui/PageHeader";
import Pagination from "@/components/ui/Pagination";
import Skeleton from "@/components/ui/Skeleton";
import { cn } from "@/lib/cn";

const PAGE_SIZE = 12;

export default function CategoryBrowser({
  categoryKey,
  initialSort = "featured",
}: {
  categoryKey: string;
  initialSort?: CatalogSort | string;
}) {
  const [filters, setFilters] = useState<CatalogFilterState>({
    search: "",
    category: "",
    availability: "",
    sort: parseCatalogSort(initialSort),
    minPrice: "",
    maxPrice: "",
  });
  const debouncedSearch = useDebouncedValue(filters.search, 350);
  const debouncedMin = useDebouncedValue(filters.minPrice, 500);
  const debouncedMax = useDebouncedValue(filters.maxPrice, 500);

  // Resetting the page whenever a filter changes is derived state: the page
  // only counts while the filter signature it belongs to is unchanged.
  const filterKey = [
    debouncedSearch,
    filters.availability,
    filters.sort,
    debouncedMin,
    debouncedMax,
  ].join("|");
  const [pageState, setPageState] = useState({ key: filterKey, page: 1 });
  const page = pageState.key === filterKey ? pageState.page : 1;
  const setPage = (nextPage: number) =>
    setPageState({ key: filterKey, page: nextPage });

  const query = useMemo<MarketplaceProductQuery>(
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

  const { data, loading, error, reload } = useMarketplaceCategoryProducts(
    categoryKey,
    query,
  );

  const category = data?.category ?? null;
  const products = data?.products ?? [];

  if (error && !loading && !category) {
    return (
      <MarketplaceContainer className="py-10 sm:py-14">
        <ErrorState
          title="We could not load this category"
          description={error}
          onRetry={reload}
          action={
            <Button href="/categories" size="sm" variant="outline">
              Browse all categories
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
      {category ? (
        <PageHeader
          breadcrumbs={[
            { label: "Home", href: "/" },
            { label: "Categories", href: "/categories" },
            { label: category.name },
          ]}
          eyebrow="Category"
          title={category.name}
          description={`Browse ${category.name.toLowerCase()} products published by approved, active stores on Routiq.`}
          meta={
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold",
                  categoryTint(category.name),
                )}
              >
                <Icon name={categoryIcon(category.name)} className="size-3" />
                {category.productCount}{" "}
                {category.productCount === 1 ? "product" : "products"}
              </span>
              <span className="rounded-full bg-soft px-2.5 py-1 text-[10px] font-medium text-muted">
                {category.storeCount}{" "}
                {category.storeCount === 1 ? "store" : "stores"}
              </span>
              {category.priceRange.min !== null ? (
                <span className="rounded-full bg-soft px-2.5 py-1 text-[10px] font-medium text-muted">
                  From {formatNaira(category.priceRange.min)}
                </span>
              ) : null}
            </div>
          }
          actions={
            <Button href="/categories" size="sm" variant="outline">
              All categories
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-3 w-80 max-w-full" />
        </div>
      )}

      <div className="mt-5">
        <CatalogControls
          value={filters}
          onChange={patchFilters}
          categories={[]}
          hideCategory
        />
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <p className="text-[11px] text-muted">
          {loading ? (
            "Finding products…"
          ) : (
            <>
              Showing{" "}
              <span className="font-semibold text-ink">
                {products.length}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-ink">
                {data?.pagination.total ?? 0}
              </span>{" "}
              products
            </>
          )}
        </p>
        {filters.search ? (
          <p className="hidden text-[11px] text-muted sm:block">
            Results for “{filters.search}”
          </p>
        ) : null}
      </div>

      <div className="mt-3">
        {loading ? (
          <ProductGridSkeleton count={PAGE_SIZE} />
        ) : error ? (
          <ErrorState
            compact
            description={error}
            onRetry={reload}
            className="bg-white"
          />
        ) : products.length === 0 ? (
          <EmptyState
            icon="shopping-bag"
            title="No products in this category yet"
            description="Try clearing the filters or explore another category."
            action={
              <Button href="/categories" size="sm" variant="outline">
                Explore categories
              </Button>
            }
          />
        ) : (
          <ProductGrid products={products} priorityCount={4} />
        )}
      </div>

      {data && data.pagination.total > 0 ? (
        <Pagination
          meta={data.pagination}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
          itemLabel="products"
          className="mt-6 rounded-2xl border border-line bg-white"
        />
      ) : null}
    </MarketplaceContainer>
  );
}
