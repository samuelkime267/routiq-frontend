import type { Metadata } from "next";
import AccountPage from "@/components/marketplace/AccountPage";

export const metadata: Metadata = {
  title: "Account",
  description: "Your Routiq Marketplace account, saved items and support.",
};

export default function Page() {
  return <AccountPage />;
}
