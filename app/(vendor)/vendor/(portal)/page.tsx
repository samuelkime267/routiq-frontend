import type { Metadata } from "next";
import VendorDashboard from "@/components/vendor/portal/VendorDashboard";

export const instant = false;

export const metadata: Metadata = {
  title: "Dashboard",
  description:
    "Store health, sales performance and the work waiting on your Routiq store.",
};

export default function VendorPortalHomePage() {
  return <VendorDashboard />;
}
