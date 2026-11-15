import type { Metadata } from "next";
import LoginForm from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to shop trusted stores across Nigeria.",
};

export default function MarketplaceLoginPage() {
  return <LoginForm scope="marketplace" />;
}
