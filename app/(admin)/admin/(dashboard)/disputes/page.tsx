import type { Metadata } from "next";
import RequirePermission from "@/components/admin/RequirePermission";
import DisputeDirectory from "@/components/admin/operations/DisputeDirectory";

export const instant = false;

export const metadata: Metadata = {
  title: "Disputes",
  description:
    "Review customer and vendor disputes, their assignment and support history.",
};

export default function DisputesPage() {
  return (
    <RequirePermission permissions={["disputes.view"]}>
      <DisputeDirectory />
    </RequirePermission>
  );
}
