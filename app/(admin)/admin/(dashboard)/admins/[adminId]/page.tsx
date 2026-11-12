import AdminDetail from "@/components/admin/AdminDetail";
import RequirePermission from "@/components/admin/RequirePermission";

export const instant = false;

export default async function AdminDetailPage({
  params,
}: {
  params: Promise<{ adminId: string }>;
}) {
  const { adminId } = await params;

  return (
    <RequirePermission permissions={["admins.view"]}>
      <AdminDetail adminId={adminId} />
    </RequirePermission>
  );
}
