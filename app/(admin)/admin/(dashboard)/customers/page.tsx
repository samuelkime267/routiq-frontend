import type { Metadata } from "next";
import RequirePermission from "@/components/admin/RequirePermission";
import UserDirectory from "@/components/admin/operations/UserDirectory";

// The directory loads its live page from the API after hydration.
export const instant = false;

export const metadata: Metadata = {
  title: "Users",
  description:
    "Look up customer and vendor accounts, their orders, transactions and support history.",
};

export default function CustomersPage() {
  return (
    <RequirePermission permissions={["users.view"]}>
      <UserDirectory />
    </RequirePermission>
  );
}
