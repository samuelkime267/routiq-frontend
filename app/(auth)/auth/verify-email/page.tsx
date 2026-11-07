import type { Metadata } from "next";
import VerifyEmailForm from "@/components/auth/VerifyEmailForm";

export const metadata: Metadata = {
  title: "Verify email",
  description: "Verify your Routiq email address with a secure 6-digit code.",
};

export default function VerifyEmailPage() {
  return <VerifyEmailForm />;
}
