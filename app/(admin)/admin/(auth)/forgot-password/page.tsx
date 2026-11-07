import type { Metadata } from "next";
import AdminForgotPasswordForm from "@/components/admin/AdminForgotPasswordForm";

export const metadata: Metadata = {
  title: "Admin password recovery",
  description: "Request a secure password reset link for your admin account.",
};

export default function AdminForgotPasswordPage() {
  return <AdminForgotPasswordForm />;
}
