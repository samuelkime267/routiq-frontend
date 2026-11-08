import type { Metadata } from "next";
import RequirePermission from "@/components/admin/RequirePermission";
import ProductDirectory from "@/components/admin/products/ProductDirectory";

// The directory reads `searchParams` and loads live data after hydration.
export const instant = false;

export const metadata: Metadata = {
  title: "Products",
  description:
    "Browse the marketplace catalogue, filter listings and moderate product quality.",
};

const STATUSES = [
  "draft",
  "pending",
  "approved",
  "rejected",
  "suspended",
  "archived",
] as const;

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const initialStatus =
    status && (STATUSES as readonly string[]).includes(status)
      ? status
      : undefined;

  return (
    <RequirePermission permissions={["products.view"]}>
      <ProductDirectory initialStatus={initialStatus} />
    </RequirePermission>
  );
}
