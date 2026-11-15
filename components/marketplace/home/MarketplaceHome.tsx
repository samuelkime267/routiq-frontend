"use client";

import CategoryShelf from "@/components/marketplace/CategoryShelf";
import MarketplaceContainer from "@/components/marketplace/MarketplaceContainer";
import FeaturedProductsSection from "@/components/marketplace/home/FeaturedProductsSection";
import FeaturedStoresSection from "@/components/marketplace/home/FeaturedStoresSection";
import MarketplaceHero from "@/components/marketplace/home/MarketplaceHero";
import PopularProductsSection from "@/components/marketplace/home/PopularProductsSection";
import PromoBanner from "@/components/marketplace/home/PromoBanner";
import RecommendedSection from "@/components/marketplace/home/RecommendedSection";
import WhyRoutiq from "@/components/marketplace/home/WhyRoutiq";
import { useMarketplaceCategories } from "@/hooks/useMarketplace";

export default function MarketplaceHome() {
  const {
    data: categoryData,
    loading: categoriesLoading,
    error: categoriesError,
    reload: reloadCategories,
  } = useMarketplaceCategories({
    limit: 10,
    sortBy: "productCount",
    sortOrder: "desc",
  });

  return (
    <div>
      <MarketplaceHero />

      <div className="py-10 sm:py-14 lg:py-16">
        <MarketplaceContainer className="space-y-12 sm:space-y-16 lg:space-y-20">
          <CategoryShelf
            categories={categoryData?.categories ?? []}
            loading={categoriesLoading}
            error={categoriesError}
            onRetry={reloadCategories}
          />

          <FeaturedProductsSection />

          <PromoBanner />

          <PopularProductsSection />

          <FeaturedStoresSection />

          <RecommendedSection />

          <WhyRoutiq />
        </MarketplaceContainer>
      </div>
    </div>
  );
}
