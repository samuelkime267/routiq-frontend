import AdminOverview from "@/components/admin/AdminOverview";
import RequirePermission from "@/components/admin/RequirePermission";

export default function AdminHomePage() {
  return (
    <RequirePermission permissions={["dashboard.view"]}>
      <AdminOverview />
    </RequirePermission>
  );
}
