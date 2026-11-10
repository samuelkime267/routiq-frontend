import type { Metadata } from "next";
import RequirePermission from "@/components/admin/RequirePermission";
import EscrowDetail from "@/components/admin/operations/EscrowDetail";

export const instant = false;

export const metadata: Metadata = {
  title: "Escrow record",
  description:
    "Read-only escrow monitoring record with the order, payment and settlement status.",
};

export default async function EscrowDetailPage({
  params,
}: {
  params: Promise<{ escrowId: string }>;
}) {
  const { escrowId } = await params;

  return (
    <RequirePermission permissions={["escrow.view"]}>
      <EscrowDetail escrowId={escrowId} />
    </RequirePermission>
  );
}
