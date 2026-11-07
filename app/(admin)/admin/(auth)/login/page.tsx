import type { Metadata } from "next";
import AdminLoginForm from "@/components/admin/AdminLoginForm";

export const metadata: Metadata = {
  title: "Admin sign in",
  description: "Secure sign-in for the Routiq administration console.",
};

export default function AdminLoginPage() {
  return <AdminLoginForm />;
}
