import RequirePermission from "@/components/admin/RequirePermission";
import ModulePlaceholder from "@/components/admin/ModulePlaceholder";
import { ALL_ADMIN_NAV_ITEMS } from "@/lib/adminNavigation";

/**
 * Resolves the navigation registry entry for a console route so the page and
 * the sidebar can never disagree about which permission opens it.
 */
export default function ModuleRoute({ href }: { href: string }) {
  const item = ALL_ADMIN_NAV_ITEMS.find((navItem) => navItem.href === href);

  if (!item) {
    return <ModulePlaceholder />;
  }

  return (
    <RequirePermission permissions={item.permissions}>
      <ModulePlaceholder />
    </RequirePermission>
  );
}
