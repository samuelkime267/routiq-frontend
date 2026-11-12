import PlatformSettingsScreen from "@/components/admin/PlatformSettings";
import RequirePermission from "@/components/admin/RequirePermission";

export default function SettingsPage() {
  return (
    <RequirePermission permissions={["settings.manage"]}>
      <PlatformSettingsScreen />
    </RequirePermission>
  );
}
