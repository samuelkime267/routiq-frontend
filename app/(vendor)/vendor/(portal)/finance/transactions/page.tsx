import type { Metadata } from "next";
import VendorTransactions from "@/components/vendor/portal/VendorTransactions";

export const instant = false;

export const metadata: Metadata = {
  title: "Transactions",
  description: "Payments and refunds recorded against your store.",
};

export default function VendorTransactionsPage() {
  return <VendorTransactions />;
}
