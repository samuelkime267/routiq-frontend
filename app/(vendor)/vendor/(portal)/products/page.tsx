import type { Metadata } from "next";
import VendorProductDirectory from "@/components/vendor/portal/VendorProductDirectory";

export const instant = false;

export const metadata: Metadata = {
  title: "Products",
  description:
    "Create, refine and publish the listings in your Routiq store.",
};

export default async function VendorProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;

  return <VendorProductDirectory initialStatus={status} />;
}
