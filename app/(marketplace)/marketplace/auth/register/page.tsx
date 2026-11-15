import type { Metadata } from "next";
import RegisterForm from "@/components/auth/RegisterForm";

export const instant = false;

export const metadata: Metadata = {
  title: "Create account",
  description: "Create a shopper or vendor account on Routiq.",
};

export default async function MarketplaceRegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const { role } = await searchParams;

  return (
    <RegisterForm
      scope="marketplace"
      initialRole={role === "vendor" ? "vendor" : "user"}
    />
  );
}
