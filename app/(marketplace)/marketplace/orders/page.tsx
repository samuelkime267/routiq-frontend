import type { Metadata } from "next";
import OrdersPage from "@/components/marketplace/OrdersPage";

export const metadata: Metadata = {
  title: "Your orders",
  description:
    "Track payment, delivery and each store's fulfilment for your Routiq orders.",
};

export default function Page() {
  return <OrdersPage />;
}
