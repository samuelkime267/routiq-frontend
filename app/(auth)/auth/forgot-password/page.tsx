import type { Metadata } from "next";
import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Forgot password",
  description: "Request a secure password reset link for your Routiq account.",
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
