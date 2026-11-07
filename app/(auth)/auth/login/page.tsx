import type { Metadata } from "next";
import LoginForm from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to shop, manage your store, or run deliveries on Routiq.",
};

export default function LoginPage() {
  return <LoginForm />;
}
