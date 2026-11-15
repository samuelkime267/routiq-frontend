import type { Metadata } from "next";
import HelpPage from "@/components/marketplace/HelpPage";

export const metadata: Metadata = {
  title: "Help and FAQs",
  description:
    "Answers about shopping, approved stores, delivery and your Routiq account.",
};

export default function Page() {
  return <HelpPage />;
}
