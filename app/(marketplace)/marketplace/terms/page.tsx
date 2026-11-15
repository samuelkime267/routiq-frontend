import type { Metadata } from "next";
import TermsPage from "@/components/marketplace/TermsPage";

export const metadata: Metadata = {
  title: "Terms of use",
  description:
    "The terms that apply when you shop, sell or browse on Routiq Marketplace.",
};

export default function Page() {
  return <TermsPage />;
}
