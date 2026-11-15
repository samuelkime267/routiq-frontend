import type { Metadata } from "next";
import CartPage from "@/components/marketplace/CartPage";

export const metadata: Metadata = {
  title: "Shopping cart",
  description: "Review the products saved in your Routiq Marketplace cart.",
};

export default function Page() {
  return <CartPage />;
}
