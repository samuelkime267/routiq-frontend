"use client";

import ProductShelf from "@/components/marketplace/ProductShelf";
import {
  useFeaturedProducts,
  useMarketplaceProducts,
} from "@/hooks/useMarketplace";

export default function FeaturedProductsSection() {
  const featured = useFeaturedProducts({ limit: 8 });
  const fallback = useMarketplaceProducts({
    limit: 8,
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  const featuredProducts = featured.data?.products ?? [];
  const usingFallback =
    !featured.loading && !featured.error && featuredProducts.length === 0;
  const products = usingFallback
    ? (fallback.data?.products ?? [])
    : featuredProducts;

  const loading = featured.loading || (usingFallback && fallback.loading);
  const error = featured.error ?? (usingFallback ? fallback.error : null);

  return (
    <ProductShelf
      eyebrow="Curated for you"
      title="Featured products"
      description="Handpicked products from approved stores across the marketplace."
      href="/products"
      linkLabel="View all products"
      products={products}
      loading={loading}
      error={error}
      onRetry={usingFallback ? fallback.reload : featured.reload}
      priorityCount={4}
      emptyTitle="Featured picks are being curated"
      emptyDescription="Browse the full marketplace while stores publish new products."
    />
  );
}
