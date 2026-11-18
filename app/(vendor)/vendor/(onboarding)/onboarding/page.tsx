import type { Metadata } from "next";
import OnboardingWizard from "@/components/vendor/onboarding/OnboardingWizard";

export const metadata: Metadata = {
  title: "Store onboarding",
  description:
    "Complete your Routiq store application with business, location, payout, and KYB details.",
};

export default function VendorOnboardingPage() {
  return <OnboardingWizard />;
}
