import type { Metadata } from "next";
import VendorWithdrawals from "@/components/vendor/portal/VendorWithdrawals";

export const instant = false;

export const metadata: Metadata = {
  title: "Withdrawals",
  description: "Request payouts of your settled Routiq balance.",
};

export default function VendorWithdrawalsPage() {
  return <VendorWithdrawals />;
}
