"use client";

import SectionHeading from "@/components/marketplace/SectionHeading";
import ProductGrid, {
  ProductGridSkeleton,
} from "@/components/marketplace/ProductGrid";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import type { MarketplaceProduct } from "@/types/api";

interface ProductShelfProps {
  eyebrow?: string;
  title: string;
  description?: string;
  href?: string;
  linkLabel?: string;
  products: MarketplaceProduct[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
  skeletonCount?: number;
  priorityCount?: number;
}

export default function ProductShelf({
  eyebrow,
  title,
  description,
  href,
  linkLabel,
  products,
  loading = false,
  error,
  onRetry,
  emptyTitle = "Nothing here yet",
  emptyDescription = "New products will appear here as stores add their catalogue.",
  skeletonCount = 8,
  priorityCount = 0,
}: ProductShelfProps) {
  return (
    <section>
      <SectionHeading
        eyebrow={eyebrow}
        title={title}
        description={description}
        href={href}
        linkLabel={linkLabel}
      />

      {loading ? (
        <ProductGridSkeleton count={skeletonCount} />
      ) : error ? (
        <ErrorState
          compact
          description={error}
          onRetry={onRetry}
          className="bg-white"
        />
      ) : products.length === 0 ? (
        <EmptyState
          compact
          icon="shopping-bag"
          title={emptyTitle}
          description={emptyDescription}
          action={
            <Button href="/products" size="sm" variant="outline">
              Browse products
            </Button>
          }
        />
      ) : (
        <ProductGrid products={products} priorityCount={priorityCount} />
      )}
    </section>
  );
}
