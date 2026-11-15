"use client";

import StoreShelf from "@/components/marketplace/StoreShelf";
import {
  useFeaturedStores,
  useMarketplaceStores,
} from "@/hooks/useMarketplace";

export default function FeaturedStoresSection() {
  const featured = useFeaturedStores({ limit: 3 });
  const fallback = useMarketplaceStores({
    limit: 3,
    sortBy: "productCount",
    sortOrder: "desc",
  });

  const featuredStores = featured.data?.stores ?? [];
  const usingFallback =
    !featured.loading && !featured.error && featuredStores.length === 0;
  const stores = usingFallback ? (fallback.data?.stores ?? []) : featuredStores;

  const loading = featured.loading || (usingFallback && fallback.loading);
  const error = featured.error ?? (usingFallback ? fallback.error : null);
  const description =
    featured.data?.ranking.label ??
    "Approved Nigerian businesses with active storefronts and products ready to browse.";

  return (
    <StoreShelf
      title="Featured stores"
      description={
        usingFallback
          ? "Approved stores with the fullest catalogues this week."
          : description
      }
      stores={stores}
      loading={loading}
      error={error}
      onRetry={usingFallback ? fallback.reload : featured.reload}
    />
  );
}
