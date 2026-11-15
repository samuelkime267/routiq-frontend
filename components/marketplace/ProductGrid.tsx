import ProductCard from "@/components/marketplace/ProductCard";
import Skeleton from "@/components/ui/Skeleton";
import { cn } from "@/lib/cn";
import type { MarketplaceProduct } from "@/types/api";

export default function ProductGrid({
  products,
  priorityCount = 0,
  className,
}: {
  products: MarketplaceProduct[];
  priorityCount?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 lg:gap-5",
        className,
      )}
    >
      {products.map((product, index) => (
        <ProductCard
          key={product._id}
          product={product}
          priority={index < priorityCount}
        />
      ))}
    </div>
  );
}

export function ProductGridSkeleton({
  count = 8,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 lg:gap-5",
        className,
      )}
    >
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-[18px] border border-line bg-white"
        >
          <Skeleton className="aspect-square rounded-none" />
          <div className="space-y-2.5 p-4">
            <Skeleton className="h-2.5 w-1/2" />
            <Skeleton className="h-3.5 w-11/12" />
            <Skeleton className="h-3 w-2/3" />
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-9 w-full rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
