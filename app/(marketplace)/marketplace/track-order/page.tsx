import type { Metadata } from "next";
import TrackOrderPage from "@/components/marketplace/TrackOrderPage";

export const metadata: Metadata = {
  title: "Track order",
  description:
    "Request the latest delivery status for a Routiq Marketplace order.",
};

export default function Page() {
  return <TrackOrderPage />;
}
