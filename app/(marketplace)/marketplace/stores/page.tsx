import { Suspense } from "react";
import type { Metadata } from "next";
import MarketplaceRouteSkeleton from "@/components/marketplace/MarketplaceRouteSkeleton";
import StoresBrowser from "@/components/marketplace/StoresBrowser";

export const metadata: Metadata = {
  title: "Stores",
  description:
    "Browse approved and active Nigerian stores selling on Routiq Marketplace.",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default function StoresPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <Suspense fallback={<MarketplaceRouteSkeleton />}>
      <StoresContent searchParams={searchParams} />
    </Suspense>
  );
}

async function StoresContent({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const read = (key: string) => {
    const value = params[key];
    return Array.isArray(value) ? value[0] : value;
  };

  return (
    <StoresBrowser
      initialSearch={read("search") ?? read("q") ?? ""}
      initialCategory={read("category") ?? ""}
    />
  );
}
