import StoreCard from "@/components/marketplace/StoreCard";
import Skeleton from "@/components/ui/Skeleton";
import { cn } from "@/lib/cn";
import type { MarketplaceStore } from "@/types/api";

const grid = "grid gap-4 sm:grid-cols-2 lg:grid-cols-3";

export default function StoreGrid({
  stores,
  className,
}: {
  stores: MarketplaceStore[];
  className?: string;
}) {
  return (
    <div className={cn(grid, className)}>
      {stores.map((store) => (
        <StoreCard key={store._id} store={store} />
      ))}
    </div>
  );
}

export function StoreGridSkeleton({
  count = 3,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div aria-hidden="true" className={cn(grid, className)}>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-[20px] border border-line bg-white"
        >
          <Skeleton className="h-32 rounded-none" />
          <div className="px-4 pb-4">
            <Skeleton className="-mt-7 size-14 rounded-2xl border-4 border-white" />
            <Skeleton className="mt-3 h-3.5 w-2/3" />
            <Skeleton className="mt-2 h-3 w-full" />
            <Skeleton className="mt-2 h-3 w-4/5" />
            <div className="mt-4 flex items-center justify-between">
              <Skeleton className="h-2.5 w-1/3" />
              <Skeleton className="h-2.5 w-1/4" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
