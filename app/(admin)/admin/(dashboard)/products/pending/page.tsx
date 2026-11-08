import type { Metadata } from "next";
import RequirePermission from "@/components/admin/RequirePermission";
import ProductDirectory from "@/components/admin/products/ProductDirectory";

// The queue loads live data after hydration.
export const instant = false;

export const metadata: Metadata = {
  title: "Pending product moderation",
  description:
    "Work through vendor listings waiting for catalogue moderation.",
};

export default function PendingProductsPage() {
  return (
    <RequirePermission permissions={["products.view"]}>
      <ProductDirectory mode="pending" />
    </RequirePermission>
  );
}
