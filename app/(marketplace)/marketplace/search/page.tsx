import { Suspense } from "react";
import type { Metadata } from "next";
import MarketplaceRouteSkeleton from "@/components/marketplace/MarketplaceRouteSkeleton";
import SearchResults from "@/components/marketplace/SearchResults";
import type { MarketplaceSearchType } from "@/types/api";

export const metadata: Metadata = {
  title: "Search",
  description:
    "Search products, categories and approved stores across Routiq Marketplace.",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default function SearchPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <Suspense fallback={<MarketplaceRouteSkeleton variant="search" />}>
      <SearchContent searchParams={searchParams} />
    </Suspense>
  );
}

async function SearchContent({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const read = (key: string) => {
    const value = params[key];
    return Array.isArray(value) ? value[0] : value;
  };

  const rawType = read("type");
  const type: MarketplaceSearchType =
    rawType === "products" || rawType === "stores" ? rawType : "all";

  return (
    <SearchResults
      initialQuery={read("q") ?? read("query") ?? ""}
      initialType={type}
    />
  );
}
