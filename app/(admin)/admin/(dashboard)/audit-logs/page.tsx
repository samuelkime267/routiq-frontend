import AuditLogDirectory from "@/components/admin/AuditLogDirectory";
import RequirePermission from "@/components/admin/RequirePermission";

export default function AuditLogsPage() {
  return (
    <RequirePermission permissions={["audit_logs.view"]}>
      <AuditLogDirectory />
    </RequirePermission>
  );
}
