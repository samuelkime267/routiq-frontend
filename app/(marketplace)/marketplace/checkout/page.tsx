import type { Metadata } from "next";
import CheckoutPage from "@/components/marketplace/CheckoutPage";

export const metadata: Metadata = {
  title: "Checkout",
  description:
    "Confirm delivery, review each store's fulfilment and pay securely on Routiq Marketplace.",
};

export default function Page() {
  return <CheckoutPage />;
}
