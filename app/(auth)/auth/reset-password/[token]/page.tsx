import type { Metadata } from "next";
import ResetPasswordForm from "@/components/auth/ResetPasswordForm";

export const instant = false;

export const metadata: Metadata = {
  title: "Reset password",
  description: "Choose a new password for your Routiq account.",
};

export default async function ResetPasswordPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  return <ResetPasswordForm token={token} />;
}
