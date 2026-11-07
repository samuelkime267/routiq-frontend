import type { Metadata } from "next";
import RequirePermission from "@/components/admin/RequirePermission";
import StoreApprovals from "@/components/admin/stores/StoreApprovals";

export const metadata: Metadata = {
  title: "Store approvals",
  description:
    "Review vendor store applications, verify KYB documents and manage the store lifecycle.",
};

const STATUSES = [
  "draft",
  "pending",
  "under_review",
  "approved",
  "rejected",
  "suspended",
  "closed",
] as const;

export default async function StoresPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const initialStatus =
    status && (STATUSES as readonly string[]).includes(status)
      ? status
      : undefined;

  return (
    <RequirePermission permissions={["stores.view"]}>
      <StoreApprovals initialStatus={initialStatus} />
    </RequirePermission>
  );
}
