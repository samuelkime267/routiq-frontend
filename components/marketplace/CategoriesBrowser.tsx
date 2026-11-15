"use client";

import { useState } from "react";
import CategoryGrid, {
  CategoryGridSkeleton,
} from "@/components/marketplace/CategoryGrid";
import MarketplaceContainer from "@/components/marketplace/MarketplaceContainer";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useMarketplaceCategories } from "@/hooks/useMarketplace";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import { Select } from "@/components/ui/Form";
import PageHeader from "@/components/ui/PageHeader";
import SearchInput from "@/components/ui/SearchInput";
import type { PublicCategorySortField } from "@/types/api";

export default function CategoriesBrowser() {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] =
    useState<PublicCategorySortField>("productCount");
  const debouncedSearch = useDebouncedValue(search, 350);

  const { data, loading, error, reload } = useMarketplaceCategories({
    search: debouncedSearch.trim() || undefined,
    sortBy,
    sortOrder: "desc",
    limit: 50,
  });

  const categories = data?.categories ?? [];

  return (
    <MarketplaceContainer className="py-6 sm:py-8 lg:py-10">
      <PageHeader
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Categories" },
        ]}
        eyebrow="Discover"
        title="Shop by category"
        description="Every category below is derived from products published by approved, active stores."
        meta={
          <p className="text-[10.5px] text-muted">
            {loading
              ? "Loading categories…"
              : `${data?.pagination.total ?? 0} categories available`}
          </p>
        }
      />

      <div className="mt-5 flex flex-col gap-3 rounded-[18px] border border-line bg-white p-3.5 sm:flex-row sm:items-end sm:p-4">
        <label className="min-w-0 flex-1">
          <span className="mb-1 block text-[9px] font-semibold tracking-[0.14em] text-muted uppercase">
            Find a category
          </span>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search categories"
            className="[&_input]:h-10"
          />
        </label>
        <label className="sm:w-48">
          <span className="mb-1 block text-[9px] font-semibold tracking-[0.14em] text-muted uppercase">
            Sort by
          </span>
          <Select
            value={sortBy}
            onChange={(event) =>
              setSortBy(event.target.value as PublicCategorySortField)
            }
            className="h-10 rounded-xl text-[12px]"
          >
            <option value="productCount">Most products</option>
            <option value="name">Name: A to Z</option>
          </Select>
        </label>
      </div>

      <div className="mt-5">
        {loading ? (
          <CategoryGridSkeleton count={10} />
        ) : error ? (
          <ErrorState
            description={error}
            onRetry={reload}
            className="bg-white"
          />
        ) : categories.length === 0 ? (
          <EmptyState
            icon="grid"
            title="No categories found"
            description={
              search
                ? "Try a different search term."
                : "Categories appear automatically as approved stores publish products."
            }
            action={
              search ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSearch("")}
                >
                  Clear search
                </Button>
              ) : (
                <Button href="/products" size="sm" variant="outline">
                  Browse products
                </Button>
              )
            }
          />
        ) : (
          <CategoryGrid categories={categories} />
        )}
      </div>
    </MarketplaceContainer>
  );
}
