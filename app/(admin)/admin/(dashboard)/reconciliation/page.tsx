import type { Metadata } from "next";
import RequirePermission from "@/components/admin/RequirePermission";
import ReconciliationReport from "@/components/admin/operations/ReconciliationReport";

export const instant = false;

export const metadata: Metadata = {
  title: "Reconciliation",
  description:
    "Compare internal payments with the escrow ledger and flag discrepancies.",
};

export default function ReconciliationPage() {
  return (
    <RequirePermission permissions={["financials.view"]}>
      <ReconciliationReport />
    </RequirePermission>
  );
}
