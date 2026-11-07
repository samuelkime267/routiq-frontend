import type { Metadata } from "next";
import RequirePermission from "@/components/admin/RequirePermission";
import VendorProfile from "@/components/admin/vendors/VendorProfile";

export const metadata: Metadata = {
  title: "Vendor profile",
  description:
    "Review a vendor's account, store, products, orders, transactions, verification history and administrative notes.",
};

export default async function VendorProfilePage({
  params,
}: {
  params: Promise<{ vendorId: string }>;
}) {
  const { vendorId } = await params;

  return (
    <RequirePermission permissions={["vendors.view"]}>
      <VendorProfile vendorId={vendorId} />
    </RequirePermission>
  );
}
