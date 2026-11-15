import type { Metadata } from "next";
import MarketplaceHome from "@/components/marketplace/home/MarketplaceHome";

export const metadata: Metadata = {
  title: "Shop trusted stores across Nigeria",
  description:
    "Discover products from approved Nigerian stores, browse categories, compare Naira prices and save your favourites on Routiq Marketplace.",
};

export default function MarketplacePage() {
  return <MarketplaceHome />;
}
