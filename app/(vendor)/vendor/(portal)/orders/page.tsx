import type { Metadata } from "next";
import VendorOrderDirectory from "@/components/vendor/portal/VendorOrderDirectory";

export const instant = false;

export const metadata: Metadata = {
  title: "Orders",
  description: "Confirm, prepare and fulfil the orders placed with your store.",
};

export default function VendorOrdersPage() {
  return <VendorOrderDirectory />;
}
