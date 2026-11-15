"use client";

import { useMemo, useState } from "react";
import MarketplaceContainer from "@/components/marketplace/MarketplaceContainer";
import StoreGrid, {
  StoreGridSkeleton,
} from "@/components/marketplace/StoreGrid";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import {
  useMarketplaceCategories,
  useMarketplaceStores,
} from "@/hooks/useMarketplace";
import type {
  MarketplaceStoreQuery,
  PublicStoreSortField,
} from "@/types/api";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import { Select } from "@/components/ui/Form";
import PageHeader from "@/components/ui/PageHeader";
import Pagination from "@/components/ui/Pagination";
import SearchInput from "@/components/ui/SearchInput";

const PAGE_SIZE = 9;

export default function StoresBrowser({
  initialSearch = "",
  initialCategory = "",
}: {
  initialSearch?: string;
  initialCategory?: string;
}) {
  const [search, setSearch] = useState(initialSearch);
  const [category, setCategory] = useState(initialCategory);
  const [sortBy, setSortBy] =
    useState<PublicStoreSortField>("productCount");

  const debouncedSearch = useDebouncedValue(search, 350);

  // Resetting the page whenever a filter changes is derived state: the page
  // only counts while the filter signature it belongs to is unchanged.
  const filterKey = [debouncedSearch, category, sortBy].join("|");
  const [pageState, setPageState] = useState({ key: filterKey, page: 1 });
  const page = pageState.key === filterKey ? pageState.page : 1;
  const setPage = (nextPage: number) =>
    setPageState({ key: filterKey, page: nextPage });

  const query = useMemo<MarketplaceStoreQuery>(
    () => ({
      search: debouncedSearch.trim() || undefined,
      category: category || undefined,
      sortBy,
      sortOrder: sortBy === "name" ? "asc" : "desc",
      page,
      limit: PAGE_SIZE,
    }),
    [debouncedSearch, category, sortBy, page],
  );

  const { data: categoryData } = useMarketplaceCategories({
    limit: 50,
    sortBy: "productCount",
    sortOrder: "desc",
  });
  const { data, loading, error, reload } = useMarketplaceStores(query);

  const stores = data?.stores ?? [];
  const hasFilters = Boolean(search) || Boolean(category) || sortBy !== "productCount";

  return (
    <MarketplaceContainer className="py-6 sm:py-8 lg:py-10">
      <PageHeader
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Stores" },
        ]}
        eyebrow="Approved vendors"
        title="Stores on Routiq"
        description="Every storefront here is approved, active and stocking products from a verified vendor."
        meta={
          <p className="text-[10.5px] text-muted">
            {loading
              ? "Loading stores…"
              : `${data?.pagination.total ?? 0} ${data?.pagination.total === 1 ? "store" : "stores"} available`}
          </p>
        }
      />

      <div className="mt-5 flex flex-col gap-3 rounded-[18px] border border-line bg-white p-3.5 sm:flex-row sm:items-end sm:p-4">
        <label className="min-w-0 flex-1">
          <span className="mb-1 block text-[9px] font-semibold tracking-[0.14em] text-muted uppercase">
            Search stores
          </span>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by store name or category"
            className="[&_input]:h-10"
          />
        </label>
        <label className="sm:w-48">
          <span className="mb-1 block text-[9px] font-semibold tracking-[0.14em] text-muted uppercase">
            Category
          </span>
          <Select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="h-10 rounded-xl text-[12px]"
          >
            <option value="">All categories</option>
            {(categoryData?.categories ?? []).map((entry) => (
              <option key={entry.key} value={entry.name}>
                {entry.name}
              </option>
            ))}
          </Select>
        </label>
        <label className="sm:w-44">
          <span className="mb-1 block text-[9px] font-semibold tracking-[0.14em] text-muted uppercase">
            Sort by
          </span>
          <Select
            value={sortBy}
            onChange={(event) =>
              setSortBy(event.target.value as PublicStoreSortField)
            }
            className="h-10 rounded-xl text-[12px]"
          >
            <option value="productCount">Most stocked</option>
            <option value="createdAt">Newest stores</option>
            <option value="name">Name: A to Z</option>
          </Select>
        </label>
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <p className="text-[11px] text-muted">
          {loading ? (
            "Finding stores…"
          ) : (
            <>
              Showing{" "}
              <span className="font-semibold text-ink">{stores.length}</span> of{" "}
              <span className="font-semibold text-ink">
                {data?.pagination.total ?? 0}
              </span>{" "}
              stores
            </>
          )}
        </p>
        {search ? (
          <p className="hidden text-[11px] text-muted sm:block">
            Results for “{search}”
          </p>
        ) : null}
      </div>

      <div className="mt-3">
        {loading ? (
          <StoreGridSkeleton count={6} />
        ) : error ? (
          <ErrorState
            description={error}
            onRetry={reload}
            className="bg-white"
          />
        ) : stores.length === 0 ? (
          <EmptyState
            icon="store"
            title="No stores match those filters"
            description={
              hasFilters
                ? "Try a different search term or category."
                : "Approved stores will appear here as they join the marketplace."
            }
            action={
              hasFilters ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSearch("");
                    setCategory("");
                    setSortBy("productCount");
                  }}
                >
                  Clear filters
                </Button>
              ) : (
                <Button href="/products" size="sm" variant="outline">
                  Browse products
                </Button>
              )
            }
          />
        ) : (
          <StoreGrid stores={stores} />
        )}
      </div>

      {data && data.pagination.total > 0 ? (
        <Pagination
          meta={data.pagination}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
          itemLabel="stores"
          className="mt-6 rounded-2xl border border-line bg-white"
        />
      ) : null}
    </MarketplaceContainer>
  );
}
