import type { Metadata } from "next";
import PrivacyPage from "@/components/marketplace/PrivacyPage";

export const metadata: Metadata = {
  title: "Privacy policy",
  description:
    "How Routiq collects, uses and protects personal information across the marketplace.",
};

export default function Page() {
  return <PrivacyPage />;
}
