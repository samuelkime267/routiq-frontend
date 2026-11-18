import type { Metadata } from "next";
import VendorFinance from "@/components/vendor/portal/VendorFinance";

export const instant = false;

export const metadata: Metadata = {
  title: "Finance",
  description: "Sales, escrow settlements, fees and withdrawable balance.",
};

export default function VendorFinancePage() {
  return <VendorFinance />;
}
