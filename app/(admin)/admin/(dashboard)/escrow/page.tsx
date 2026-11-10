import type { Metadata } from "next";
import RequirePermission from "@/components/admin/RequirePermission";
import EscrowDirectory from "@/components/admin/operations/EscrowDirectory";

export const instant = false;

export const metadata: Metadata = {
  title: "Escrow",
  description:
    "Track held funds, release schedules and the escrow liability across orders.",
};

export default function EscrowPage() {
  return (
    <RequirePermission permissions={["escrow.view"]}>
      <EscrowDirectory />
    </RequirePermission>
  );
}
