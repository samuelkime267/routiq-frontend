import type { Metadata } from "next";
import LoginForm from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Vendor sign in",
  description: "Sign in to manage your Routiq storefront and fulfil orders.",
};

export default function VendorLoginPage() {
  return <LoginForm scope="vendor" />;
}
