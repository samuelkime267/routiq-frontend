import type { AdminPermission } from "@/types/api";
import type { IconName } from "@/components/icons";

export interface AdminNavItem {
  href: string;
  label: string;
  icon: IconName;
  /** The item is visible when the admin holds at least one of these. */
  permissions: AdminPermission[];
  description: string;
}

export interface AdminNavGroup {
  id: string;
  label: string;
  items: AdminNavItem[];
}

/**
 * Single source of truth for the admin console navigation, breadcrumbs and
 * route access. Feature access is permission-based; role names are never
 * compared here.
 */
export const ADMIN_NAVIGATION: AdminNavGroup[] = [
  {
    id: "overview",
    label: "Overview",
    items: [
      {
        href: "/",
        label: "Dashboard",
        icon: "activity",
        permissions: ["dashboard.view"],
        description:
          "Platform health, operational queues and your administrative access.",
      },
    ],
  },
  {
    id: "marketplace",
    label: "Marketplace",
    items: [
      {
        href: "/vendors",
        label: "Vendors",
        icon: "users",
        permissions: ["vendors.view"],
        description:
          "Browse vendor accounts, review their business profile and manage access.",
      },
      {
        href: "/stores",
        label: "Store Approvals",
        icon: "store",
        permissions: ["stores.view"],
        description:
          "Review store applications, approve verified businesses and manage suspensions.",
      },
      {
        href: "/products",
        label: "Products",
        icon: "package",
        permissions: ["products.view"],
        description:
          "Browse the catalogue, monitor quality and moderate listings.",
      },
      {
        href: "/orders",
        label: "Orders",
        icon: "shopping-bag",
        permissions: ["orders.view"],
        description: "Track orders, fulfilment progress and exceptions.",
      },
      {
        href: "/customers",
        label: "Customers",
        icon: "users",
        permissions: ["users.view"],
        description: "Look up customer accounts and activity.",
      },
    ],
  },
  {
    id: "financials",
    label: "Financials",
    items: [
      {
        href: "/payments",
        label: "Payments & Transactions",
        icon: "card",
        permissions: ["transactions.view"],
        description: "Monitor payments, settlements and transaction disputes.",
      },
      {
        href: "/escrow",
        label: "Escrow",
        icon: "wallet",
        permissions: ["escrow.view"],
        description: "Track held funds, release schedules and balances.",
      },
      {
        href: "/reports",
        label: "Financial Reports",
        icon: "bar-chart",
        permissions: ["transactions.view"],
        description: "Exportable summaries for reconciliation and reporting.",
      },
    ],
  },
  {
    id: "operations",
    label: "Operations",
    items: [
      {
        href: "/logistics",
        label: "Logistics & Deliveries",
        icon: "truck",
        permissions: ["shipments.view"],
        description: "Follow shipments and resolve delivery exceptions.",
      },
      {
        href: "/disputes",
        label: "Disputes & Support",
        icon: "message-square",
        permissions: ["disputes.view"],
        description: "Handle customer and vendor disputes with a clear trail.",
      },
    ],
  },
  {
    id: "administration",
    label: "Administration",
    items: [
      {
        href: "/admins",
        label: "Admin Management",
        icon: "shield",
        permissions: ["admins.view"],
        description:
          "Invite administrators and manage their access lifecycle.",
      },
      {
        href: "/roles",
        label: "Roles & Permissions",
        icon: "key",
        permissions: ["roles.manage"],
        description: "Understand and adjust what each administrative role can do.",
      },
      {
        href: "/audit-logs",
        label: "Audit Logs",
        icon: "file-text",
        permissions: ["audit_logs.view"],
        description: "Review sensitive administrative actions over time.",
      },
      {
        href: "/settings",
        label: "Settings",
        icon: "settings",
        permissions: ["settings.manage"],
        description: "Configure platform-wide administrative preferences.",
      },
    ],
  },
];

export const ALL_ADMIN_NAV_ITEMS = ADMIN_NAVIGATION.flatMap(
  (group) => group.items,
);

export function canAccessItem(
  item: AdminNavItem,
  permissions: readonly AdminPermission[],
) {
  return item.permissions.some((permission) =>
    permissions.includes(permission),
  );
}

export function visibleNavigation(permissions: readonly AdminPermission[]) {
  return ADMIN_NAVIGATION.map((group) => ({
    ...group,
    items: group.items.filter((item) => canAccessItem(item, permissions)),
  })).filter((group) => group.items.length > 0);
}

export function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function findNavItem(pathname: string) {
  for (const group of ADMIN_NAVIGATION) {
    for (const item of group.items) {
      if (isActivePath(pathname, item.href)) return { group, item };
    }
  }

  return null;
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function breadcrumbsFor(pathname: string): BreadcrumbItem[] {
  const match = findNavItem(pathname);

  if (!match) {
    return [{ label: "Admin console", href: "/" }, { label: "Not found" }];
  }

  if (match.group.id === "overview") {
    return [{ label: match.item.label }];
  }

  return [
    { label: "Admin console", href: "/" },
    { label: match.group.label },
    { label: match.item.label },
  ];
}
