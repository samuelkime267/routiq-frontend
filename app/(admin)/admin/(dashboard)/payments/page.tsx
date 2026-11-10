import type { Metadata } from "next";
import RequirePermission from "@/components/admin/RequirePermission";
import TransactionDirectory from "@/components/admin/operations/TransactionDirectory";

export const instant = false;

export const metadata: Metadata = {
  title: "Transactions",
  description:
    "Monitor payments and refunds with their order, customer, vendor and escrow record.",
};

export default function PaymentsPage() {
  return (
    <RequirePermission permissions={["transactions.view"]}>
      <TransactionDirectory />
    </RequirePermission>
  );
}
