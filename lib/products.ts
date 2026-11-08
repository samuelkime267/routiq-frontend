import type { IconName } from "@/components/icons";
import type {
  ApiProduct,
  ApiProductReview,
  ApiProductStoreSummary,
  ApiProductVendorSummary,
  ProductPublicationStatus,
  ProductReviewAction,
  ProductStatus,
} from "@/types/api";

export const PRODUCT_STATUS_LABELS: Record<ProductStatus, string> = {
  draft: "Draft",
  pending: "Pending moderation",
  approved: "Approved",
  rejected: "Rejected",
  suspended: "Suspended",
  archived: "Archived",
};

export const PRODUCT_STATUS_OPTIONS = (
  Object.entries(PRODUCT_STATUS_LABELS) as [ProductStatus, string][]
).map(([value, label]) => ({ value, label }));

export function productStatusLabel(status?: ProductStatus | null) {
  return status ? (PRODUCT_STATUS_LABELS[status] ?? status) : "Unknown";
}

export const PRODUCT_PUBLICATION_LABELS: Record<
  ProductPublicationStatus,
  string
> = {
  unpublished: "Unpublished",
  published: "Published",
};

export function productPublicationLabel(
  status?: ProductPublicationStatus | null,
) {
  return status ? (PRODUCT_PUBLICATION_LABELS[status] ?? status) : "Unpublished";
}

export const PRODUCT_REVIEW_ACTION_LABELS: Record<
  ProductReviewAction,
  string
> = {
  submitted: "Submitted for moderation",
  approved: "Approved",
  rejected: "Rejected",
  suspended: "Suspended",
  restored: "Restored",
};

const PRODUCT_REVIEW_ACTION_ICONS: Record<ProductReviewAction, IconName> = {
  submitted: "file",
  approved: "check-circle",
  rejected: "alert-circle",
  suspended: "lock",
  restored: "refresh",
};

const PRODUCT_REVIEW_ACTION_TONES: Record<
  ProductReviewAction,
  "teal" | "lime" | "amber" | "neutral" | "danger"
> = {
  submitted: "teal",
  approved: "lime",
  rejected: "danger",
  suspended: "danger",
  restored: "lime",
};

export function reviewActionPresentation(action: ProductReviewAction) {
  return {
    label: PRODUCT_REVIEW_ACTION_LABELS[action] ?? action,
    icon: PRODUCT_REVIEW_ACTION_ICONS[action] ?? "clock",
    tone: PRODUCT_REVIEW_ACTION_TONES[action] ?? "neutral",
  };
}

export function productReviewActorName(review: ApiProductReview) {
  if (!review.actor || typeof review.actor === "string") {
    return review.actorRole === "vendor" ? "Vendor" : "System";
  }

  return review.actor.name;
}

export function productVendor(
  product: ApiProduct,
): ApiProductVendorSummary | null {
  return product.vendor && typeof product.vendor !== "string"
    ? product.vendor
    : null;
}

export function productStore(
  product: ApiProduct,
): ApiProductStoreSummary | null {
  return product.store && typeof product.store !== "string"
    ? product.store
    : null;
}

export function productImage(product: ApiProduct) {
  return product.images.find(Boolean) ?? null;
}

export interface InventoryState {
  label: string;
  tone: "green" | "amber" | "red" | "neutral";
}

export function inventoryState(stock: number): InventoryState {
  if (stock <= 0) return { label: "Out of stock", tone: "red" };
  if (stock <= 5) return { label: "Low stock", tone: "amber" };

  return { label: "In stock", tone: "green" };
}
