import type { Metadata } from "next";
import RequirePermission from "@/components/admin/RequirePermission";
import ShipmentDetail from "@/components/admin/logistics/ShipmentDetail";

// The detail workspace needs the shipment id and loads its record on the client.
export const instant = false;

export const metadata: Metadata = {
  title: "Shipment detail",
  description:
    "Inspect provider status, tracking history, courier details and synchronisation diagnostics.",
};

export default async function ShipmentDetailPage({
  params,
}: {
  params: Promise<{ shipmentId: string }>;
}) {
  const { shipmentId } = await params;

  return (
    <RequirePermission permissions={["shipments.view"]}>
      <ShipmentDetail shipmentId={shipmentId} />
    </RequirePermission>
  );
}
