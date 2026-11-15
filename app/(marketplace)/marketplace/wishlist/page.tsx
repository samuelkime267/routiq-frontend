import type { Metadata } from "next";
import WishlistPage from "@/components/marketplace/WishlistPage";

export const metadata: Metadata = {
  title: "Wishlist",
  description: "Products saved for later on Routiq Marketplace.",
};

export default function Page() {
  return <WishlistPage />;
}
