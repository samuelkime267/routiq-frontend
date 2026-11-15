"use client";

import ProductShelf from "@/components/marketplace/ProductShelf";
import { useMarketplace } from "@/components/marketplace/MarketplaceProvider";
import {
  useMarketplaceProducts,
  useTrendingProducts,
} from "@/hooks/useMarketplace";
import { slugify } from "@/lib/marketplace";

function TrendingRecommendations() {
  const { data, loading, error, reload } = useTrendingProducts({ limit: 8 });

  return (
    <ProductShelf
      eyebrow="For you"
      title="Recommended for you"
      description="Trending products from approved stores right now."
      href="/products?sortBy=createdAt&sortOrder=desc"
      linkLabel="See what is new"
      products={data?.products ?? []}
      loading={loading}
      error={error}
      onRetry={reload}
      emptyTitle="Recommendations are warming up"
      emptyDescription="Browse a few products and your recommendations will take shape."
    />
  );
}

function CategoryRecommendations({ category }: { category: string }) {
  const { data, loading, error, reload } = useMarketplaceProducts({
    category,
    limit: 8,
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  return (
    <ProductShelf
      eyebrow="Based on your activity"
      title={`More in ${category}`}
      description="Picked from the category you have been browsing, saving and adding to your cart."
      href={`/categories/${slugify(category)}`}
      linkLabel="Explore category"
      products={data?.products ?? []}
      loading={loading}
      error={error}
      onRetry={reload}
      emptyTitle="No more products in this category yet"
      emptyDescription="Explore the rest of the marketplace for more finds."
    />
  );
}

export default function RecommendedSection() {
  const { cart, wishlist } = useMarketplace();
  const category =
    cart[0]?.product.category ?? wishlist[0]?.category ?? null;

  return category ? (
    <CategoryRecommendations category={category} />
  ) : (
    <TrendingRecommendations />
  );
}
