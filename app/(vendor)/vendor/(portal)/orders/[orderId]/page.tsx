import type { Metadata } from "next";
import VendorOrderDetail from "@/components/vendor/portal/VendorOrderDetail";

// The detail workspace needs the order id and loads its record on the client.
export const instant = false;

export const metadata: Metadata = {
  title: "Order detail",
  description: "Payment, items and fulfilment for one of your store orders.",
};

export default async function VendorOrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ orderId: string }>;
  searchParams: Promise<{ action?: string }>;
}) {
  const [{ orderId }, { action }] = await Promise.all([params, searchParams]);
  const initialAction =
    action === "ship" || action === "deliver" ? action : undefined;

  return <VendorOrderDetail orderId={orderId} initialAction={initialAction} />;
}
