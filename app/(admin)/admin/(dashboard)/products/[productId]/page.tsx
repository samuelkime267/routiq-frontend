import type { Metadata } from "next";
import RequirePermission from "@/components/admin/RequirePermission";
import ProductDetail from "@/components/admin/products/ProductDetail";

// The detail workspace needs the product id and loads its record on the client.
export const instant = false;

export const metadata: Metadata = {
  title: "Product detail",
  description:
    "Review listing details, images, inventory and moderation history.",
};

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;

  return (
    <RequirePermission permissions={["products.view"]}>
      <ProductDetail productId={productId} />
    </RequirePermission>
  );
}
