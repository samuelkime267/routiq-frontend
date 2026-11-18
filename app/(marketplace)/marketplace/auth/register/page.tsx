import type { Metadata } from "next";
import { redirect } from "next/navigation";
import RegisterForm from "@/components/auth/RegisterForm";
import { vendorRegisterUrl } from "@/lib/urls";

export const instant = false;

export const metadata: Metadata = {
  title: "Create account",
  description: "Create a shopper account on Routiq.",
};

export default async function MarketplaceRegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const { role } = await searchParams;

  // Vendor accounts are created on the vendor host so the new session lives
  // where the vendor will use it.
  if (role === "vendor") {
    redirect(vendorRegisterUrl());
  }

  return <RegisterForm scope="marketplace" />;
}
