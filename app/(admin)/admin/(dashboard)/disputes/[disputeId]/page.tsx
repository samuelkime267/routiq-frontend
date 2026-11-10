import type { Metadata } from "next";
import RequirePermission from "@/components/admin/RequirePermission";
import DisputeDetail from "@/components/admin/operations/DisputeDetail";

export const instant = false;

export const metadata: Metadata = {
  title: "Dispute",
  description:
    "Assign, review and resolve a dispute without changing payment or escrow records.",
};

export default async function DisputeDetailPage({
  params,
}: {
  params: Promise<{ disputeId: string }>;
}) {
  const { disputeId } = await params;

  return (
    <RequirePermission permissions={["disputes.view"]}>
      <DisputeDetail disputeId={disputeId} />
    </RequirePermission>
  );
}
