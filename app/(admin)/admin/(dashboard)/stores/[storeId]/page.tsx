import type { Metadata } from "next";
import RequirePermission from "@/components/admin/RequirePermission";
import StoreReview from "@/components/admin/stores/StoreReview";

export const metadata: Metadata = {
  title: "Store review",
  description:
    "Verify KYB documents, review store details and record an approval decision.",
};

export default async function StoreReviewPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;

  return (
    <RequirePermission permissions={["stores.view"]}>
      <StoreReview storeId={storeId} />
    </RequirePermission>
  );
}
