import type { Metadata } from "next";
import RequirePermission from "@/components/admin/RequirePermission";
import OrderDetail from "@/components/admin/orders/OrderDetail";

// The detail workspace needs the order id and loads its record on the client.
export const instant = false;

export const metadata: Metadata = {
  title: "Order detail",
  description:
    "Inspect items, pricing, payment, escrow, vendor sub-orders, shipments and the recorded timeline.",
};

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;

  return (
    <RequirePermission permissions={["orders.view"]}>
      <OrderDetail orderId={orderId} />
    </RequirePermission>
  );
}
