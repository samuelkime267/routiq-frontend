import AdminManagement from "@/components/admin/AdminManagement";
import RequirePermission from "@/components/admin/RequirePermission";

export default function AdminsPage() {
  return (
    <RequirePermission permissions={["admins.view"]}>
      <AdminManagement />
    </RequirePermission>
  );
}
