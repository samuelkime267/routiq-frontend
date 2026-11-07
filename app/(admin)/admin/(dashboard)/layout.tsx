import type { ReactNode } from "react";
import AdminSessionProvider from "@/components/admin/AdminSession";
import AdminShell from "@/components/admin/AdminShell";
import ToastProvider from "@/components/ui/Toast";

export default function AdminDashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <AdminSessionProvider>
      <ToastProvider>
        <AdminShell>{children}</AdminShell>
      </ToastProvider>
    </AdminSessionProvider>
  );
}
