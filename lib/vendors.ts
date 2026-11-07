import type { IconName } from "@/components/icons";
import type {
  ApiStoreReview,
  StoreReviewAction,
  StoreStatus,
} from "@/types/api";

export const STORE_STATUS_LABELS: Record<StoreStatus, string> = {
  draft: "Draft",
  pending: "Pending review",
  under_review: "Under review",
  approved: "Approved",
  rejected: "Rejected",
  suspended: "Suspended",
  closed: "Closed",
};

export const STORE_STATUS_OPTIONS = (
  Object.entries(STORE_STATUS_LABELS) as [StoreStatus, string][]
).map(([value, label]) => ({ value, label }));

export function storeStatusLabel(status?: StoreStatus | null) {
  return status ? (STORE_STATUS_LABELS[status] ?? status) : "Unknown";
}

export const STORE_REVIEW_ACTION_LABELS: Record<StoreReviewAction, string> = {
  submitted: "Application submitted",
  resubmitted: "Application resubmitted",
  approved: "Store approved",
  rejected: "Application rejected",
  information_requested: "More information requested",
  suspended: "Store suspended",
  reactivated: "Store reactivated",
  closed: "Store closed",
};

const STORE_REVIEW_ACTION_ICONS: Record<StoreReviewAction, IconName> = {
  submitted: "file",
  resubmitted: "refresh",
  approved: "check-circle",
  rejected: "alert-circle",
  information_requested: "message-square",
  suspended: "lock",
  reactivated: "check-circle",
  closed: "x",
};

const STORE_REVIEW_ACTION_TONES: Record<
  StoreReviewAction,
  "teal" | "lime" | "amber" | "neutral" | "danger"
> = {
  submitted: "teal",
  resubmitted: "teal",
  approved: "lime",
  rejected: "danger",
  information_requested: "amber",
  suspended: "danger",
  reactivated: "lime",
  closed: "neutral",
};

export function reviewActionLabel(action: StoreReviewAction) {
  return STORE_REVIEW_ACTION_LABELS[action] ?? action;
}

export function reviewActionPresentation(action: StoreReviewAction) {
  return {
    label: reviewActionLabel(action),
    icon: STORE_REVIEW_ACTION_ICONS[action] ?? "clock",
    tone: STORE_REVIEW_ACTION_TONES[action] ?? "neutral",
  };
}

export function reviewActorName(review: ApiStoreReview) {
  if (!review.actor || typeof review.actor === "string") {
    return review.actorRole === "vendor" ? "Vendor" : "System";
  }

  return review.actor.name;
}

export const BUSINESS_TYPE_LABELS: Record<string, string> = {
  individual: "Individual",
  sole_proprietorship: "Sole proprietorship",
  partnership: "Partnership",
  limited_company: "Limited company",
  other: "Other",
};

export function formatBusinessType(value?: string | null) {
  return value ? (BUSINESS_TYPE_LABELS[value] ?? value) : "—";
}

export const STORE_DOCUMENT_LABELS: Record<string, string> = {
  cac_certificate: "CAC certificate",
  business_name_certificate: "Business name certificate",
  tin_certificate: "TIN certificate",
  utility_bill: "Utility bill / proof of address",
  government_id: "Government-issued ID",
  bank_statement: "Bank statement",
  other: "Other document",
};

export function formatStoreDocument(type: string) {
  return STORE_DOCUMENT_LABELS[type] ?? type;
}

export function vendorCanTrade(storeStatus?: StoreStatus | null) {
  return storeStatus === "approved";
}
