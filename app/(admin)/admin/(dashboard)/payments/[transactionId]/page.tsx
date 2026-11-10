import type { Metadata } from "next";
import RequirePermission from "@/components/admin/RequirePermission";
import TransactionDetail from "@/components/admin/operations/TransactionDetail";

export const instant = false;

export const metadata: Metadata = {
  title: "Transaction",
  description:
    "Review a payment or refund, its order, parties, escrow record and verification source.",
};

export default async function TransactionDetailPage({
  params,
}: {
  params: Promise<{ transactionId: string }>;
}) {
  const { transactionId } = await params;

  return (
    <RequirePermission permissions={["transactions.view"]}>
      <TransactionDetail transactionId={transactionId} />
    </RequirePermission>
  );
}
