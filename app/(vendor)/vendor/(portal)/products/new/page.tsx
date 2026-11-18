import type { Metadata } from "next";
import VendorProductForm from "@/components/vendor/portal/VendorProductForm";

export const instant = false;

export const metadata: Metadata = {
  title: "New listing",
  description: "Add a product to your Routiq store.",
};

export default function VendorNewProductPage() {
  return <VendorProductForm />;
}
