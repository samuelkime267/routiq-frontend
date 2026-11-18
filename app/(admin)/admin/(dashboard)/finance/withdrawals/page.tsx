import type { Metadata } from "next";
import RequirePermission from "@/components/admin/RequirePermission";
import WithdrawalReview from "@/components/admin/finance/WithdrawalReview";

// The review desk loads live ledger data on the client.
export const instant = false;

export const metadata: Metadata = {
  title: "Vendor withdrawals",
  description:
    "Review payout requests, confirm transfers and verify vendor payout accounts.",
};

export default function WithdrawalsPage() {
  return (
    <RequirePermission permissions={["withdrawals.view"]}>
      <WithdrawalReview />
    </RequirePermission>
  );
}
