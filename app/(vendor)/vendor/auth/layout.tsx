import type { ReactNode } from "react";
import AuthCard from "@/components/auth/AuthCard";

export default function VendorAuthLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <AuthCard>{children}</AuthCard>;
}
