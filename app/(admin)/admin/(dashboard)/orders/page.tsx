import type { Metadata } from "next";
import RequirePermission from "@/components/admin/RequirePermission";
import OrderDirectory from "@/components/admin/orders/OrderDirectory";

// The directory loads live order data after hydration.
export const instant = false;

export const metadata: Metadata = {
  title: "Orders",
  description:
    "Browse customer orders, vendor sub-orders, payment state and fulfilment progress.",
};

export default function OrdersPage() {
  return (
    <RequirePermission permissions={["orders.view"]}>
      <OrderDirectory />
    </RequirePermission>
  );
}
