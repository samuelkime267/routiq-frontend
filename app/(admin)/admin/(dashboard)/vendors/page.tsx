import type { Metadata } from "next";
import RequirePermission from "@/components/admin/RequirePermission";
import VendorDirectory from "@/components/admin/vendors/VendorDirectory";

// The directory loads its live page from the API after hydration.
export const instant = false;

export const metadata: Metadata = {
  title: "Vendors",
  description:
    "Browse vendor accounts, their stores and lifetime commerce totals.",
};

export default function VendorsPage() {
  return (
    <RequirePermission permissions={["vendors.view"]}>
      <VendorDirectory />
    </RequirePermission>
  );
}
