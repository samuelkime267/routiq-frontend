import type { ReactNode } from "react";
import ToastProvider from "@/components/ui/Toast";
import VendorSession from "@/components/vendor/portal/VendorSession";
import VendorShell from "@/components/vendor/portal/VendorShell";

export default function VendorPortalLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <VendorSession>
      <ToastProvider>
        <VendorShell>{children}</VendorShell>
      </ToastProvider>
    </VendorSession>
  );
}
