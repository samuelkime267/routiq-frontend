import type { Metadata } from "next";
import OnboardingWizard from "@/components/vendor/onboarding/OnboardingWizard";

export const instant = false;

export const metadata: Metadata = {
  title: "Edit store application",
  description: "Update your Routiq store details and resubmit for review.",
};

export default async function VendorOnboardingStorePage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;

  return <OnboardingWizard storeId={storeId} />;
}
