import type { IconName } from "@/components/icons";
import type { BreadcrumbItem } from "@/lib/adminNavigation";

export interface VendorNavItem {
  href: string;
  label: string;
  icon: IconName;
  description: string;
  /** Extra paths that should still highlight this item. */
  match?: string[];
}

export interface VendorNavGroup {
  id: string;
  label: string;
  items: VendorNavItem[];
}

/**
 * Single source of truth for vendor portal navigation and breadcrumbs.
 *
 * The portal is a selling workspace, so the groups follow the vendor's own
 * workflow: overview, catalogue, sales, money, account.
 */
export const VENDOR_NAVIGATION: VendorNavGroup[] = [
  {
    id: "overview",
    label: "Overview",
    items: [
      {
        href: "/",
        label: "Dashboard",
        icon: "activity",
        description:
          "Store health, sales performance and the work waiting on you today.",
      },
    ],
  },
  {
    id: "catalogue",
    label: "Catalogue",
    items: [
      {
        href: "/products",
        label: "Products",
        icon: "tag",
        description: "Listings, moderation status and publication.",
      },
      {
        href: "/inventory",
        label: "Inventory",
        icon: "package",
        description: "Stock levels, low-stock alerts and availability.",
      },
    ],
  },
  {
    id: "sales",
    label: "Sales",
    items: [
      {
        href: "/orders",
        label: "Orders",
        icon: "shopping-bag",
        description: "Confirm, prepare and ship your customer orders.",
      },
    ],
  },
  {
    id: "finance",
    label: "Finance",
    items: [
      {
        href: "/finance",
        label: "Finance",
        icon: "bar-chart",
        description: "Earnings, settlements and your balance.",
      },
      {
        href: "/finance/transactions",
        label: "Transactions",
        icon: "card",
        description: "Every payment and refund on your store.",
      },
      {
        href: "/finance/withdrawals",
        label: "Withdrawals",
        icon: "wallet",
        description: "Request payouts and follow their progress.",
      },
      {
        href: "/finance/bank-accounts",
        label: "Bank accounts",
        icon: "building",
        description: "Accounts payouts can be sent to.",
      },
    ],
  },
  {
    id: "account",
    label: "Account",
    items: [
      {
        href: "/settings",
        label: "Settings",
        icon: "settings",
        description: "Profile, storefront and operating details.",
      },
    ],
  },
];

export const ALL_VENDOR_NAV_ITEMS = VENDOR_NAVIGATION.flatMap(
  (group) => group.items,
);

/**
 * Resolves the active item by longest match so `/finance/withdrawals` never
 * also highlights `/finance`.
 */
export function findVendorNavItem(pathname: string) {
  const cleaned = pathname.replace(/\/$/, "") || "/";
  let best: { group: VendorNavGroup; item: VendorNavItem } | null = null;

  for (const group of VENDOR_NAVIGATION) {
    for (const item of group.items) {
      const candidates = [item.href, ...(item.match ?? [])];
      const matches = candidates.some((candidate) =>
        candidate === "/"
          ? cleaned === "/"
          : cleaned === candidate || cleaned.startsWith(`${candidate}/`),
      );

      if (!matches) continue;

      if (!best || item.href.length > best.item.href.length) {
        best = { group, item };
      }
    }
  }

  return best;
}

export function isActiveVendorPath(pathname: string, item: VendorNavItem) {
  const match = findVendorNavItem(pathname);

  return match?.item.href === item.href;
}

export function vendorBreadcrumbs(
  pathname: string,
  trailing?: BreadcrumbItem[],
): BreadcrumbItem[] {
  const match = findVendorNavItem(pathname);
  const home: BreadcrumbItem = { label: "Dashboard", href: "/" };

  if (!match || match.group.id === "overview") {
    return trailing?.length ? [home, ...trailing] : [home];
  }

  const section: BreadcrumbItem = {
    label: match.group.label,
    href: match.item.href,
  };

  return trailing?.length
    ? [home, section, ...trailing]
    : [home, section, { label: match.item.label }];
}
