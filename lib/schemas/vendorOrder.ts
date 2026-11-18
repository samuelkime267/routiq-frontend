import { z } from "zod";

export const vendorShipmentSchema = z.object({
  courierName: z
    .string()
    .trim()
    .min(2, "Courier name is required")
    .max(120, "Keep the courier name under 120 characters"),
  trackingNumber: z
    .string()
    .trim()
    .min(2, "Tracking number is required")
    .max(120, "Keep the tracking number under 120 characters"),
  trackingUrl: z
    .string()
    .trim()
    .max(500)
    .refine(
      (value) => value === "" || /^https?:\/\/.+/i.test(value),
      "Enter a valid tracking URL",
    ),
  estimatedDeliveryAt: z.string().trim(),
  note: z.string().trim().max(500, "Keep the note under 500 characters"),
});

export type VendorShipmentValues = z.infer<typeof vendorShipmentSchema>;

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
