import type { Metadata } from "next";
import DeliveryPage from "@/components/marketplace/DeliveryPage";

export const metadata: Metadata = {
  title: "Delivery information",
  description:
    "How delivery works on Routiq Marketplace, including fees, timing and tracking.",
};

export default function Page() {
  return <DeliveryPage />;
}
