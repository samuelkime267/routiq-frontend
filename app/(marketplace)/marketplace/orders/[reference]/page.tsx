import { Suspense } from "react";
import type { Metadata } from "next";
import MarketplaceRouteSkeleton from "@/components/marketplace/MarketplaceRouteSkeleton";
import OrderDetailPage from "@/components/marketplace/OrderDetailPage";

export const metadata: Metadata = {
  title: "Order details",
  description:
    "Payment, delivery and store fulfilment details for one Routiq order.",
};

export default function Page({
  params,
}: {
  params: Promise<{ reference: string }>;
}) {
  return (
    <Suspense fallback={<MarketplaceRouteSkeleton variant="detail" />}>
      <OrderContent params={params} />
    </Suspense>
  );
}

async function OrderContent({
  params,
}: {
  params: Promise<{ reference: string }>;
}) {
  const { reference } = await params;

  return <OrderDetailPage reference={reference} />;
}
