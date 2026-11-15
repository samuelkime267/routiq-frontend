import { Suspense } from "react";
import type { Metadata } from "next";
import CategoryBrowser from "@/components/marketplace/CategoryBrowser";
import MarketplaceRouteSkeleton from "@/components/marketplace/MarketplaceRouteSkeleton";

export const metadata: Metadata = {
  title: "Category",
  description:
    "Browse products in this category from approved and active Routiq stores.",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ categoryKey: string }>;
  searchParams: SearchParams;
}) {
  return (
    <Suspense fallback={<MarketplaceRouteSkeleton />}>
      <CategoryContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function CategoryContent({
  params,
  searchParams,
}: {
  params: Promise<{ categoryKey: string }>;
  searchParams: SearchParams;
}) {
  const { categoryKey } = await params;
  const query = await searchParams;
  const sort = Array.isArray(query.sort) ? query.sort[0] : query.sort;

  return <CategoryBrowser categoryKey={categoryKey} initialSort={sort} />;
}
