import type { Metadata } from "next";
import AdminResetPasswordForm from "@/components/admin/AdminResetPasswordForm";

export const instant = false;

export const metadata: Metadata = {
  title: "Reset admin password",
  description: "Set a new password for your Routiq admin account.",
};

export default async function AdminResetPasswordPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  return <AdminResetPasswordForm token={token} />;
}
