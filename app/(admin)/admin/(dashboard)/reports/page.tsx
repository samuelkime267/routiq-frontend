import type { Metadata } from "next";
import RequirePermission from "@/components/admin/RequirePermission";
import FinancialOverview from "@/components/admin/operations/FinancialOverview";

export const instant = false;

export const metadata: Metadata = {
  title: "Financial overview",
  description:
    "Keep GMV, collected payments, commission, refunds, settlements and escrow separate.",
};

export default function ReportsPage() {
  return (
    <RequirePermission permissions={["financials.view"]}>
      <FinancialOverview />
    </RequirePermission>
  );
}
