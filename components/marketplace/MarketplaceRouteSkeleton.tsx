import MarketplaceContainer from "@/components/marketplace/MarketplaceContainer";
import Skeleton from "@/components/ui/Skeleton";

/**
 * Static shell shown while a route resolves its params. Keeps navigation
 * responsive without an empty flash of content.
 */
export default function MarketplaceRouteSkeleton({
  variant = "catalog",
}: {
  variant?: "catalog" | "detail" | "search";
}) {
  return (
    <MarketplaceContainer className="py-6 sm:py-8 lg:py-10">
      <Skeleton className="h-3 w-40" />
      <Skeleton className="mt-4 h-8 w-64 max-w-full" />
      <Skeleton className="mt-3 h-3 w-[420px] max-w-full" />

      {variant === "detail" ? (
        <div className="mt-6 grid gap-7 lg:grid-cols-2 lg:gap-12">
          <Skeleton className="aspect-square rounded-[24px]" />
          <div className="space-y-3">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-9 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-12 w-full rounded-full" />
          </div>
        </div>
      ) : (
        <>
          {variant === "catalog" ? (
            <Skeleton className="mt-6 h-[74px] w-full rounded-[18px]" />
          ) : (
            <Skeleton className="mt-6 h-11 w-full max-w-md rounded-full" />
          )}
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <Skeleton
                key={index}
                className="aspect-[4/5] rounded-[18px]"
              />
            ))}
          </div>
        </>
      )}
    </MarketplaceContainer>
  );
}
