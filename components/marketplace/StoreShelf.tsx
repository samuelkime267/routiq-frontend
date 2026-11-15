"use client";

import SectionHeading from "@/components/marketplace/SectionHeading";
import StoreGrid, {
  StoreGridSkeleton,
} from "@/components/marketplace/StoreGrid";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import type { MarketplaceStore } from "@/types/api";

interface StoreShelfProps {
  title?: string;
  description?: string;
  href?: string;
  stores: MarketplaceStore[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  skeletonCount?: number;
}

export default function StoreShelf({
  title = "Featured stores",
  description = "Independent Nigerian businesses with approved, active storefronts.",
  href = "/stores",
  stores,
  loading = false,
  error,
  onRetry,
  skeletonCount = 3,
}: StoreShelfProps) {
  return (
    <section>
      <SectionHeading
        eyebrow="Trusted vendors"
        title={title}
        description={description}
        href={href}
        linkLabel="View all stores"
      />

      {loading ? (
        <StoreGridSkeleton count={skeletonCount} />
      ) : error ? (
        <ErrorState
          compact
          description={error}
          onRetry={onRetry}
          className="bg-white"
        />
      ) : stores.length === 0 ? (
        <EmptyState
          compact
          icon="store"
          title="No stores to show yet"
          description="Approved stores will appear here as they join the marketplace."
          action={
            <Button href="/stores" size="sm" variant="outline">
              Browse stores
            </Button>
          }
        />
      ) : (
        <StoreGrid stores={stores} />
      )}
    </section>
  );
}
