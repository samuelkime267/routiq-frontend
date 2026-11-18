"use client";

import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import Skeleton from "@/components/ui/Skeleton";
import VendorProductForm from "@/components/vendor/portal/VendorProductForm";
import { useResource } from "@/hooks/useResource";
import { vendorPortalApi } from "@/lib/api";
import type { VendorProductDetailResult } from "@/types/api";

export default function VendorProductEditor({
  productId,
}: {
  productId: string;
}) {
  const { data, error, loading, reload } = useResource<VendorProductDetailResult>(
    `vendor-product:${productId}`,
    () => vendorPortalApi.product(productId),
    "We could not load this listing.",
  );

  if (loading && !data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-56 rounded-xl" />
        <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <Skeleton className="h-[520px] rounded-2xl" />
          <Skeleton className="h-[520px] rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!data) {
    const notFound = error?.toLowerCase().includes("not found");

    return notFound ? (
      <EmptyState
        icon="package"
        title="Listing not found"
        description="This product does not exist in your store, or it belongs to another vendor."
        action={
          <Button href="/products" size="sm">
            Back to products
          </Button>
        }
      />
    ) : (
      <ErrorState
        title="Listing unavailable"
        description={error ?? "We could not load this listing."}
        onRetry={reload}
        action={
          <Button href="/products" variant="outline" size="sm">
            Back to products
          </Button>
        }
      />
    );
  }

  return <VendorProductForm product={data.product} />;
}
