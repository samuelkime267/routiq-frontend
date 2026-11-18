import type { Metadata } from "next";
import VendorSettings from "@/components/vendor/portal/VendorSettings";

export const instant = false;

export const metadata: Metadata = {
  title: "Settings",
  description: "Your profile, storefront and pickup settings.",
};

export default function VendorSettingsPage() {
  return <VendorSettings />;
}
