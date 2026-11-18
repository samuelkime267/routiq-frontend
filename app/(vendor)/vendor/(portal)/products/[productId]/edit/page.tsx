import type { Metadata } from "next";
import VendorProductEditor from "@/components/vendor/portal/VendorProductEditor";

export const instant = false;

export const metadata: Metadata = {
  title: "Edit listing",
  description: "Update the content, price and stock of a Routiq listing.",
};

export default async function VendorEditProductPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;

  return <VendorProductEditor productId={productId} />;
}
