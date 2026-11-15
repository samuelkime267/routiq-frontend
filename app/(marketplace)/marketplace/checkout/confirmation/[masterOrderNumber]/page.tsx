import { Suspense } from "react";
import type { Metadata } from "next";
import CheckoutConfirmation from "@/components/marketplace/CheckoutConfirmation";
import MarketplaceRouteSkeleton from "@/components/marketplace/MarketplaceRouteSkeleton";

export const metadata: Metadata = {
  title: "Checkout confirmation",
  description:
    "Payment status, order reference and delivery details for your Routiq order.",
};

export default function CheckoutConfirmationPage({
  params,
  searchParams,
}: {
  params: Promise<{ masterOrderNumber: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <Suspense fallback={<MarketplaceRouteSkeleton variant="detail" />}>
      <ConfirmationContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function ConfirmationContent({
  params,
  searchParams,
}: {
  params: Promise<{ masterOrderNumber: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { masterOrderNumber } = await params;
  const query = await searchParams;
  const raw = query.reference ?? query.trxref;
  const providerReference = Array.isArray(raw) ? (raw[0] ?? null) : (raw ?? null);

  return (
    <CheckoutConfirmation
      masterOrderNumber={masterOrderNumber}
      providerReference={providerReference}
    />
  );
}
