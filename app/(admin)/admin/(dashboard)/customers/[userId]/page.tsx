import type { Metadata } from "next";
import RequirePermission from "@/components/admin/RequirePermission";
import UserProfile from "@/components/admin/operations/UserProfile";

// The profile needs the user id and loads its record on the client.
export const instant = false;

export const metadata: Metadata = {
  title: "User profile",
  description:
    "Review an account's role, orders, transactions, disputes and administrative notes.",
};

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;

  return (
    <RequirePermission permissions={["users.view"]}>
      <UserProfile userId={userId} />
    </RequirePermission>
  );
}
