"use client";

import CategoryGrid, {
  CategoryGridSkeleton,
} from "@/components/marketplace/CategoryGrid";
import SectionHeading from "@/components/marketplace/SectionHeading";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import type { MarketplaceCategory } from "@/types/api";

interface CategoryShelfProps {
  categories: MarketplaceCategory[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  title?: string;
  description?: string;
  href?: string;
  skeletonCount?: number;
}

export default function CategoryShelf({
  categories,
  loading = false,
  error,
  onRetry,
  title = "Shop by category",
  description = "Browse the departments our stores are stocking right now.",
  href = "/categories",
  skeletonCount = 10,
}: CategoryShelfProps) {
  return (
    <section>
      <SectionHeading
        eyebrow="Browse the marketplace"
        title={title}
        description={description}
        href={href}
      />

      {loading ? (
        <CategoryGridSkeleton count={skeletonCount} />
      ) : error ? (
        <ErrorState
          compact
          description={error}
          onRetry={onRetry}
          className="bg-white"
        />
      ) : categories.length === 0 ? (
        <EmptyState
          compact
          icon="grid"
          title="Categories are on the way"
          description="Categories appear automatically as approved stores publish products."
          action={
            <Button href="/products" size="sm" variant="outline">
              Browse all products
            </Button>
          }
        />
      ) : (
        <CategoryGrid categories={categories} />
      )}
    </section>
  );
}
