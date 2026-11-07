import type { Metadata } from "next";
import VendorDashboard from "@/components/vendor/VendorDashboard";

export const metadata: Metadata = {
  title: "Vendor dashboard",
  description:
    "Manage your Routiq storefront, onboarding, verification, and payouts.",
};

export default function VendorHomePage() {
  return <VendorDashboard />;
}
