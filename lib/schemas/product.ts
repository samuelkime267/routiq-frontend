import { z } from "zod";

export const PRODUCT_ACTION_KINDS = [
  "approve",
  "reject",
  "suspend",
  "restore",
] as const;

export type ProductActionKind = (typeof PRODUCT_ACTION_KINDS)[number];

export interface ProductActionLabels {
  title: string;
  description: string;
  submitLabel: string;
  tone: "primary" | "danger";
}

export const PRODUCT_ACTION_LABELS: Record<
  ProductActionKind,
  ProductActionLabels
> = {
  approve: {
    title: "Approve this product",
    description:
      "Approval records that the listing passed catalogue moderation. It does not publish the product; the vendor still decides when it becomes visible.",
    submitLabel: "Approve product",
    tone: "primary",
  },
  reject: {
    title: "Reject this product",
    description:
      "The vendor receives your reason in-app. They can correct the listing and submit it for moderation again.",
    submitLabel: "Reject product",
    tone: "danger",
  },
  suspend: {
    title: "Suspend this product",
    description:
      "Suspending removes the listing from the approved catalogue. The reason is shared with the vendor and kept in the moderation history.",
    submitLabel: "Suspend product",
    tone: "danger",
  },
  restore: {
    title: "Restore this product",
    description:
      "Restoring returns the listing to the moderation status it held before suspension. Publication stays exactly as the vendor left it.",
    submitLabel: "Restore product",
    tone: "primary",
  },
};

/**
 * One form backs all four moderation actions. Only the field required by the
 * selected action is validated, so the dialog can be shared safely.
 */
export function productActionSchema(action: ProductActionKind) {
  return z
    .object({
      note: z.string().trim().max(1000, "Keep the note under 1000 characters"),
      reason: z.string().trim().max(1000, "Keep the reason under 1000 characters"),
    })
    .superRefine((value, ctx) => {
      if (
        (action === "reject" || action === "suspend") &&
        value.reason.length < 5
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["reason"],
          message: "Give a reason of at least 5 characters",
        });
      }
    });
}

export type ProductActionValues = z.infer<
  ReturnType<typeof productActionSchema>
>;
