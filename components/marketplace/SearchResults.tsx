"use client";

import { useState } from "react";
import Link from "next/link";
import MarketplaceContainer from "@/components/marketplace/MarketplaceContainer";
import ProductGrid, {
  ProductGridSkeleton,
} from "@/components/marketplace/ProductGrid";
import SectionHeading from "@/components/marketplace/SectionHeading";
import StoreGrid, {
  StoreGridSkeleton,
} from "@/components/marketplace/StoreGrid";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useMarketplaceSearch } from "@/hooks/useMarketplace";
import type { MarketplaceSearchType } from "@/types/api";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import PageHeader from "@/components/ui/PageHeader";
import SearchInput from "@/components/ui/SearchInput";
import { cn } from "@/lib/cn";

const tabs: Array<{ value: MarketplaceSearchType; label: string }> = [
  { value: "all", label: "Everything" },
  { value: "products", label: "Products" },
  { value: "stores", label: "Stores" },
];

export default function SearchResults({
  initialQuery = "",
  initialType = "all",
}: {
  initialQuery?: string;
  initialType?: MarketplaceSearchType;
}) {
  const [term, setTerm] = useState(initialQuery);
  const [type, setType] = useState<MarketplaceSearchType>(initialType);
  const debouncedTerm = useDebouncedValue(term.trim(), 350);

  const { data, loading, error, reload, enabled } = useMarketplaceSearch({
    query: debouncedTerm,
    type,
    sortBy: "relevance",
    limit: 12,
  });

  const products = data?.products?.products ?? [];
  const stores = data?.stores?.stores ?? [];
  const productTotal = data?.products?.pagination.total ?? 0;
  const storeTotal = data?.stores?.pagination.total ?? 0;
  const total = productTotal + storeTotal;

  return (
    <MarketplaceContainer className="py-6 sm:py-8 lg:py-10">
      <PageHeader
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Search" },
        ]}
        eyebrow="Search the marketplace"
        title={initialQuery ? `Results for “${initialQuery}”` : "Search Routiq"}
        description="Find products, categories and approved stores from across the marketplace."
      />

      <div className="mt-5 rounded-[18px] border border-line bg-white p-3.5 sm:p-4">
        <label className="block">
          <span className="mb-1 block text-[9px] font-semibold tracking-[0.14em] text-muted uppercase">
            Search products, stores and categories
          </span>
          <SearchInput
            value={term}
            onChange={setTerm}
            placeholder="Try “groceries”, “charger” or a store name"
            className="[&_input]:h-11"
          />
        </label>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1 rounded-full bg-soft p-1">
            {tabs.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setType(tab.value)}
                aria-pressed={type === tab.value}
                className={cn(
                  "rounded-full px-3 py-1.5 text-[10.5px] font-semibold transition focus-visible:ring-2 focus-visible:ring-pri/30 focus-visible:outline-none",
                  type === tab.value
                    ? "bg-white text-pri shadow-sm"
                    : "text-muted hover:text-pri",
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {enabled && !loading && !error ? (
            <p className="text-[10.5px] text-muted">
              <span className="font-semibold text-ink">{total}</span>{" "}
              {total === 1 ? "result" : "results"} for “{data?.query ?? term}”
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-7">
        {!enabled ? (
          <EmptyState
            icon="search"
            title="Start with a search"
            description="Search for a product, category or store. You can also browse the full catalogue."
            action={
              <div className="flex flex-wrap items-center justify-center gap-2">
                <Button href="/products" size="sm" variant="outline">
                  Browse products
                </Button>
                <Button href="/categories" size="sm" variant="ghost">
                  Explore categories
                </Button>
              </div>
            }
          />
        ) : loading ? (
          <div className="space-y-8">
            <ProductGridSkeleton count={4} />
            <StoreGridSkeleton count={3} />
          </div>
        ) : error ? (
          <ErrorState
            description={error}
            onRetry={reload}
            className="bg-white"
          />
        ) : (
          <div className="space-y-10 sm:space-y-14">
            {type !== "stores" && productTotal > 0 ? (
              <section>
                <SectionHeading
                  title="Products"
                  description={`${productTotal} ${
                    productTotal === 1 ? "product matches" : "products match"
                  } your search.`}
                  href={`/products?search=${encodeURIComponent(term.trim())}`}
                />
                <ProductGrid products={products} priorityCount={4} />
                {productTotal > products.length ? (
                  <Link
                    href={`/products?search=${encodeURIComponent(term.trim())}`}
                    className="mt-4 inline-flex text-[11px] font-semibold text-pri hover:underline"
                  >
                    View all {productTotal} matching products
                  </Link>
                ) : null}
              </section>
            ) : null}

            {type !== "products" && storeTotal > 0 ? (
              <section>
                <SectionHeading
                  title="Stores"
                  description={`${storeTotal} ${
                    storeTotal === 1 ? "store matches" : "stores match"
                  } your search.`}
                  href={`/stores?search=${encodeURIComponent(term.trim())}`}
                  linkLabel="View all stores"
                />
                <StoreGrid stores={stores} />
                {storeTotal > stores.length ? (
                  <Link
                    href={`/stores?search=${encodeURIComponent(term.trim())}`}
                    className="mt-4 inline-flex text-[11px] font-semibold text-pri hover:underline"
                  >
                    View all {storeTotal} matching stores
                  </Link>
                ) : null}
              </section>
            ) : null}

            {total === 0 ? (
              <EmptyState
                icon="search"
                title={`No results for “${term.trim()}”`}
                description="Try a broader search term, check the spelling, or browse a category instead."
                action={
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setTerm("")}
                    >
                      Clear search
                    </Button>
                    <Button href="/categories" size="sm" variant="ghost">
                      Explore categories
                    </Button>
                  </div>
                }
              />
            ) : null}
          </div>
        )}
      </div>
    </MarketplaceContainer>
  );
}
