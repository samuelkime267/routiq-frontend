import type { Metadata } from "next";
import ContactPage from "@/components/marketplace/ContactPage";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contact Routiq Marketplace support about an order, product, store or your account.",
};

export default function Page() {
  return <ContactPage />;
}
