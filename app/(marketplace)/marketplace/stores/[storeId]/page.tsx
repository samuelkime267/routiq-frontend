import { Suspense } from "react";
import type { Metadata } from "next";
import MarketplaceRouteSkeleton from "@/components/marketplace/MarketplaceRouteSkeleton";
import StoreDetail from "@/components/marketplace/StoreDetail";

export const metadata: Metadata = {
  title: "Store",
  description:
    "Explore an approved Routiq storefront and shop its published products.",
};

export default function StorePage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  return (
    <Suspense fallback={<MarketplaceRouteSkeleton variant="detail" />}>
      <StoreContent params={params} />
    </Suspense>
  );
}

async function StoreContent({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;

  return <StoreDetail storeId={storeId} />;
}
