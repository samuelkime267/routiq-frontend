import type { Metadata } from "next";
import AboutPage from "@/components/marketplace/AboutPage";

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn how Routiq connects shoppers with approved independent Nigerian stores.",
};

export default function Page() {
  return <AboutPage />;
}
