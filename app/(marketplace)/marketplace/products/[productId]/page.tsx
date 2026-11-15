import { Suspense } from "react";
import type { Metadata } from "next";
import MarketplaceRouteSkeleton from "@/components/marketplace/MarketplaceRouteSkeleton";
import ProductDetail from "@/components/marketplace/ProductDetail";

export const metadata: Metadata = {
  title: "Product",
  description:
    "View product details, availability and store information on Routiq Marketplace.",
};

export default function ProductPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  return (
    <Suspense fallback={<MarketplaceRouteSkeleton variant="detail" />}>
      <ProductContent params={params} />
    </Suspense>
  );
}

async function ProductContent({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;

  return <ProductDetail productId={productId} />;
}
