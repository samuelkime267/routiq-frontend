import RequirePermission from "@/components/admin/RequirePermission";
import RoleManagement from "@/components/admin/RoleManagement";

export default function RolesPage() {
  return (
    <RequirePermission permissions={["roles.manage"]}>
      <RoleManagement />
    </RequirePermission>
  );
}
