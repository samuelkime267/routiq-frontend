import CategoryCard from "@/components/marketplace/CategoryCard";
import Skeleton from "@/components/ui/Skeleton";
import { cn } from "@/lib/cn";
import type { MarketplaceCategory } from "@/types/api";

const grid = "grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5";

export default function CategoryGrid({
  categories,
  className,
}: {
  categories: MarketplaceCategory[];
  className?: string;
}) {
  return (
    <div className={cn(grid, className)}>
      {categories.map((category) => (
        <CategoryCard key={category.key} category={category} />
      ))}
    </div>
  );
}

export function CategoryGridSkeleton({
  count = 10,
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
          className="rounded-[18px] border border-line bg-white p-5"
        >
          <Skeleton className="size-12 rounded-2xl" />
          <Skeleton className="mt-4 h-3 w-4/5" />
          <Skeleton className="mt-2 h-2.5 w-1/2" />
          <Skeleton className="mt-4 h-2.5 w-1/3" />
        </div>
      ))}
    </div>
  );
}
