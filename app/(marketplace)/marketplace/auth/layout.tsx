import type { ReactNode } from "react";
import AuthCard from "@/components/auth/AuthCard";

export default function MarketplaceAuthLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <AuthCard>{children}</AuthCard>;
}
