import type { ReactNode } from "react";
import VendorHeader from "@/components/vendor/VendorHeader";

/**
 * Store onboarding keeps the lightweight vendor header, while the selling
 * workspace below uses its own sidebar shell.
 */
export default function VendorOnboardingLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      <VendorHeader />
      <main className="min-h-[calc(100dvh-4rem)]">{children}</main>
    </>
  );
}
