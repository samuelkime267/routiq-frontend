import type { Metadata } from "next";
import RequirePermission from "@/components/admin/RequirePermission";
import ShipmentDirectory from "@/components/admin/logistics/ShipmentDirectory";

// The directory loads provider-backed shipment data after hydration.
export const instant = false;

export const metadata: Metadata = {
  title: "Logistics",
  description:
    "Monitor shipments, provider tracking, failed deliveries and synchronisation errors.",
};

export default function LogisticsPage() {
  return (
    <RequirePermission permissions={["shipments.view"]}>
      <ShipmentDirectory />
    </RequirePermission>
  );
}
