"use client";

import { useMemo, useState } from "react";
import CatalogControls, {
  EMPTY_CATALOG_FILTERS,
  type CatalogFilterState,
} from "@/components/marketplace/CatalogControls";
import MarketplaceContainer from "@/components/marketplace/MarketplaceContainer";
import ProductGrid, {
  ProductGridSkeleton,
} from "@/components/marketplace/ProductGrid";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import {
  useMarketplaceCategories,
  useMarketplaceProducts,
} from "@/hooks/useMarketplace";
import {
  parseCatalogSort,
  sortQuery,
  type CatalogSort,
} from "@/lib/marketplace";
import type {
  MarketplaceProductQuery,
  PublicProductAvailability,
} from "@/types/api";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import PageHeader from "@/components/ui/PageHeader";
import Pagination from "@/components/ui/Pagination";

const PAGE_SIZE = 12;

interface ProductsBrowserProps {
  initialSearch?: string;
  initialCategory?: string;
  initialAvailability?: PublicProductAvailability | "";
  initialSort?: CatalogSort | string;
}

export default function ProductsBrowser({
  initialSearch = "",
  initialCategory = "",
  initialAvailability = "",
  initialSort = "featured",
}: ProductsBrowserProps) {
  const [filters, setFilters] = useState<CatalogFilterState>({
    ...EMPTY_CATALOG_FILTERS,
    search: initialSearch,
    category: initialCategory,
    availability: initialAvailability,
    sort: parseCatalogSort(initialSort),
  });
  const debouncedSearch = useDebouncedValue(filters.search, 350);
  const debouncedMin = useDebouncedValue(filters.minPrice, 500);
  const debouncedMax = useDebouncedValue(filters.maxPrice, 500);

  const { data: categoryData } = useMarketplaceCategories({
    limit: 50,
    sortBy: "productCount",
    sortOrder: "desc",
  });

  // Resetting the page whenever a filter changes is derived state: the page
  // only counts while the filter signature it belongs to is unchanged.
  const filterKey = [
    debouncedSearch,
    filters.category,
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
      category: filters.category || undefined,
      availability: filters.availability || undefined,
      minPrice: debouncedMin ? Number(debouncedMin) : undefined,
      maxPrice: debouncedMax ? Number(debouncedMax) : undefined,
      ...sortQuery(filters.sort),
      page,
      limit: PAGE_SIZE,
    }),
    [
      debouncedSearch,
      filters.category,
      filters.availability,
      filters.sort,
      debouncedMin,
      debouncedMax,
      page,
    ],
  );

  const { data, loading, error, reload } = useMarketplaceProducts(query);

  const products = data?.products ?? [];
  const hasFilters =
    Boolean(filters.search) ||
    Boolean(filters.category) ||
    Boolean(filters.availability) ||
    Boolean(filters.minPrice) ||
    Boolean(filters.maxPrice) ||
    filters.sort !== "featured";

  const patchFilters = (patch: Partial<CatalogFilterState>) => {
    setFilters((current) => ({ ...current, ...patch }));
  };

  return (
    <MarketplaceContainer className="py-6 sm:py-8 lg:py-10">
      <PageHeader
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Products" },
        ]}
        eyebrow="Marketplace catalogue"
        title="All products"
        description="Browse every product currently published by approved, active stores on Routiq."
        meta={
          <div className="flex flex-wrap items-center gap-2 text-[10.5px] text-muted">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-soft px-2.5 py-1 font-medium">
              <span className="size-1.5 rounded-full bg-success" />
              Live catalogue
            </span>
            <span>
              {loading
                ? "Loading products…"
                : `${data?.pagination.total ?? 0} ${data?.pagination.total === 1 ? "product" : "products"} available`}
            </span>
          </div>
        }
      />

      <div className="mt-5">
        <CatalogControls
          value={filters}
          onChange={patchFilters}
          categories={categoryData?.categories ?? []}
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
            description={error}
            onRetry={reload}
            className="bg-white"
          />
        ) : products.length === 0 ? (
          <EmptyState
            icon="search"
            title="No products match those filters"
            description={
              hasFilters
                ? "Try a different search term, category or price range."
                : "Approved stores have not published products yet. Check back soon."
            }
            action={
              hasFilters ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setFilters(EMPTY_CATALOG_FILTERS)}
                >
                  Clear filters
                </Button>
              ) : (
                <Button href="/categories" size="sm" variant="outline">
                  Explore categories
                </Button>
              )
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
