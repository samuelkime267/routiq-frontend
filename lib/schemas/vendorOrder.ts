import { z } from "zod";

export const vendorCancelOrderSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(5, "Give a short reason of at least 5 characters")
    .max(500, "Keep the reason under 500 characters"),
});

export type VendorCancelOrderValues = z.infer<
  typeof vendorCancelOrderSchema
>;
