"use client";

import ProductShelf from "@/components/marketplace/ProductShelf";
import { usePopularProducts } from "@/hooks/useMarketplace";

export default function PopularProductsSection() {
  const { data, loading, error, reload } = usePopularProducts({ limit: 8 });

  return (
    <ProductShelf
      eyebrow="Most loved"
      title="Popular right now"
      description={
        data?.ranking.label ??
        "The products shoppers are buying most across Routiq."
      }
      href="/products?sortBy=featured&sortOrder=desc"
      linkLabel="Browse the marketplace"
      products={data?.products ?? []}
      loading={loading}
      error={error}
      onRetry={reload}
      emptyTitle="Popular products are on the way"
      emptyDescription="As shoppers order from approved stores, the most popular products will appear here."
    />
  );
}
