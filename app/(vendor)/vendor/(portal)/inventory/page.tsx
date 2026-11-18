import type { Metadata } from "next";
import VendorProductDirectory from "@/components/vendor/portal/VendorProductDirectory";

export const instant = false;

export const metadata: Metadata = {
  title: "Inventory",
  description: "Stock levels and availability across your Routiq listings.",
};

export default function VendorInventoryPage() {
  return <VendorProductDirectory mode="inventory" />;
}
