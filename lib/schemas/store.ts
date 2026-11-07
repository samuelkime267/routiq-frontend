import { z } from "zod";

export const STORE_ACTION_KINDS = [
  "approve",
  "reject",
  "request-information",
  "suspend",
  "reactivate",
] as const;

export type StoreActionKind = (typeof STORE_ACTION_KINDS)[number];

export interface StoreActionLabels {
  title: string;
  description: string;
  submitLabel: string;
  tone: "primary" | "danger";
}

export const STORE_ACTION_LABELS: Record<StoreActionKind, StoreActionLabels> = {
  approve: {
    title: "Approve this store",
    description:
      "Approving lets the vendor publish products and start trading. Confirm that the KYB documents and settlement details have been verified.",
    submitLabel: "Approve store",
    tone: "primary",
  },
  reject: {
    title: "Reject this application",
    description:
      "The vendor receives your reason in-app and can correct the application and resubmit it.",
    submitLabel: "Reject application",
    tone: "danger",
  },
  "request-information": {
    title: "Request more information",
    description:
      "The store stays under review. Explain exactly what the vendor needs to update or upload.",
    submitLabel: "Send request",
    tone: "primary",
  },
  suspend: {
    title: "Suspend this store",
    description:
      "Suspending stops the store from trading. The reason is shared with the vendor and kept in the review history.",
    submitLabel: "Suspend store",
    tone: "danger",
  },
  reactivate: {
    title: "Reactivate this store",
    description:
      "Reactivating returns the store to approved status so the vendor can trade again.",
    submitLabel: "Reactivate store",
    tone: "primary",
  },
};

/**
 * The dialog carries three optional fields, but only the one required by the
 * selected action is validated. Keeping one schema keeps the form typed while
 * the refinement enforces the workflow rules client-side.
 */
export function storeActionSchema(action: StoreActionKind) {
  return z
    .object({
      note: z.string().trim().max(1000, "Keep the note under 1000 characters"),
      reason: z.string().trim().max(1000, "Keep the reason under 1000 characters"),
      message: z
        .string()
        .trim()
        .max(2000, "Keep the request under 2000 characters"),
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

      if (action === "request-information" && value.message.length < 10) {
        ctx.addIssue({
          code: "custom",
          path: ["message"],
          message: "Explain what is needed in at least 10 characters",
        });
      }
    });
}

export type StoreActionValues = z.infer<ReturnType<typeof storeActionSchema>>;

export const vendorStatusFormSchema = z
  .object({
    status: z.enum(["active", "suspended"]),
    reason: z.string().trim().max(1000),
  })
  .superRefine((value, ctx) => {
    if (value.status === "suspended" && value.reason.length < 5) {
      ctx.addIssue({
        code: "custom",
        path: ["reason"],
        message: "Give a suspension reason of at least 5 characters",
      });
    }
  });

export type VendorStatusFormValues = z.infer<typeof vendorStatusFormSchema>;

export const adminNoteSchema = z.object({
  body: z
    .string()
    .trim()
    .min(3, "A note needs at least 3 characters")
    .max(2000, "Keep the note under 2000 characters"),
});

export type AdminNoteValues = z.infer<typeof adminNoteSchema>;
