import type { Metadata } from "next";
import VendorBankAccounts from "@/components/vendor/portal/VendorBankAccounts";

export const instant = false;

export const metadata: Metadata = {
  title: "Bank accounts",
  description: "Accounts that can receive your Routiq withdrawals.",
};

export default function VendorBankAccountsPage() {
  return <VendorBankAccounts />;
}
