import { Suspense } from "react";
import type { Metadata } from "next";
import MarketplaceRouteSkeleton from "@/components/marketplace/MarketplaceRouteSkeleton";
import ProductsBrowser from "@/components/marketplace/ProductsBrowser";

export const metadata: Metadata = {
  title: "All products",
  description:
    "Browse every product published by approved and active stores on Routiq Marketplace.",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default function ProductsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <Suspense fallback={<MarketplaceRouteSkeleton />}>
      <ProductsContent searchParams={searchParams} />
    </Suspense>
  );
}

async function ProductsContent({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const read = (key: string) => {
    const value = params[key];
    return Array.isArray(value) ? value[0] : value;
  };

  const availability = read("availability");
  const initialAvailability =
    availability === "in_stock" || availability === "out_of_stock"
      ? availability
      : "";

  return (
    <ProductsBrowser
      initialSearch={read("search") ?? read("q") ?? ""}
      initialCategory={read("category") ?? ""}
      initialAvailability={initialAvailability}
      initialSort={read("sort") ?? "featured"}
    />
  );
}
