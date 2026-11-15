import type { Metadata } from "next";
import CategoriesBrowser from "@/components/marketplace/CategoriesBrowser";

export const metadata: Metadata = {
  title: "Categories",
  description:
    "Explore every product category available from approved stores on Routiq Marketplace.",
};

export default function CategoriesPage() {
  return <CategoriesBrowser />;
}
