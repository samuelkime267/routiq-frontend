import type { IconName } from "@/components/icons";
import type {
  MarketplaceCategory,
  MarketplaceProduct,
  MarketplaceStore,
} from "@/types/api";

/** Matches the backend's category key derivation (`slugify(category)`). */
export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function categoryHref(nameOrKey: string) {
  return `/categories/${slugify(nameOrKey)}`;
}

const categoryIcons: Array<{ match: RegExp; icon: IconName }> = [
  { match: /grocer|food|market|pantry/i, icon: "shopping-bag" },
  { match: /fashion|apparel|cloth|shoe|bag/i, icon: "tag" },
  { match: /electronic|tech|gadget/i, icon: "package" },
  { match: /phone|accessor/i, icon: "phone" },
  { match: /beauty|personal|cosmetic/i, icon: "sparkles" },
  { match: /home|living|furniture/i, icon: "store" },
  { match: /health|wellness|pharma/i, icon: "shield" },
  { match: /baby|kid|toy/i, icon: "heart" },
  { match: /sport|outdoor|fitness/i, icon: "activity" },
];

export function categoryIcon(name: string): IconName {
  return categoryIcons.find((entry) => entry.match.test(name))?.icon ?? "grid";
}

const categoryTints = [
  "bg-pri/[0.07] text-pri",
  "bg-accent/15 text-[#8a5a00]",
  "bg-lime/30 text-pri-deep",
  "bg-info text-[#1f5bb5]",
];

export function categoryTint(name: string) {
  const hash = Array.from(name).reduce(
    (total, character) => total + character.charCodeAt(0),
    0,
  );

  return categoryTints[hash % categoryTints.length];
}

export function productImage(product: MarketplaceProduct) {
  return product.images.find((image) => Boolean(image)) ?? null;
}

export function productDiscount(product: MarketplaceProduct) {
  const original = product.compareAtPrice;

  if (!original || original <= product.price) return null;

  const percent =
    product.discountPercent > 0
      ? Math.round(product.discountPercent)
      : Math.round(((original - product.price) / original) * 100);

  return percent > 0 ? percent : null;
}

export function storeLocation(store: MarketplaceStore) {
  return [store.address?.city, store.address?.state]
    .filter(Boolean)
    .join(", ");
}

export function initials(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}

export function categoryLabel(category: MarketplaceCategory) {
  const count = category.productCount;
  return `${count} ${count === 1 ? "product" : "products"}`;
}

export function isOptimizableImage(src: string) {
  return src.startsWith("/") || src.startsWith("https://res.cloudinary.com/");
}

export type CatalogSort =
  | "featured"
  | "newest"
  | "price_asc"
  | "price_desc"
  | "name_asc";

export const CATALOG_SORT_OPTIONS: Array<{
  value: CatalogSort;
  label: string;
}> = [
  { value: "featured", label: "Featured first" },
  { value: "newest", label: "Newest arrivals" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
  { value: "name_asc", label: "Name: A to Z" },
];

export function sortQuery(sort: CatalogSort) {
  switch (sort) {
    case "price_asc":
      return { sortBy: "price" as const, sortOrder: "asc" as const };
    case "price_desc":
      return { sortBy: "price" as const, sortOrder: "desc" as const };
    case "name_asc":
      return { sortBy: "name" as const, sortOrder: "asc" as const };
    case "featured":
      return { sortBy: "featured" as const, sortOrder: "desc" as const };
    default:
      return { sortBy: "createdAt" as const, sortOrder: "desc" as const };
  }
}

export function parseCatalogSort(value?: string | null): CatalogSort {
  return CATALOG_SORT_OPTIONS.some((option) => option.value === value)
    ? (value as CatalogSort)
    : "featured";
}

export function todayHours(store: MarketplaceStore) {
  const day = new Intl.DateTimeFormat("en-NG", {
    weekday: "long",
  })
    .format(new Date())
    .toLowerCase();
  const entry = store.operatingHours.find(
    (hour) => hour.day.toLowerCase() === day,
  );

  if (!entry) return null;
  if (!entry.isOpen) return { day: entry.day, label: "Closed today" };

  return {
    day: entry.day,
    label:
      entry.openingTime && entry.closingTime
        ? `${entry.openingTime} – ${entry.closingTime}`
        : "Open today",
  };
}

