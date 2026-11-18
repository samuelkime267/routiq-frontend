import { z } from "zod";

const money = z
  .number({ error: "Enter a valid Naira amount" })
  .int("Use a whole Naira amount")
  .min(0, "Amount cannot be negative")
  .max(100_000_000, "Amount is too large");

const stock = z
  .number({ error: "Enter a valid stock level" })
  .int("Stock must be a whole number")
  .min(0, "Stock cannot be negative")
  .max(1_000_000, "Stock is too large");

/**
 * Vendor catalogue form. Moderation status, publication and featured placement
 * are intentionally absent: the API owns them.
 */
export const vendorProductFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Product name is required")
    .max(140, "Keep the name under 140 characters"),
  category: z
    .string()
    .trim()
    .min(2, "Category is required")
    .max(80, "Keep the category under 80 characters"),
  description: z
    .string()
    .trim()
    .max(2000, "Keep the description under 2000 characters"),
  price: money,
  compareAtPrice: money.optional(),
  stock,
  sku: z.string().trim().max(64, "Keep the SKU under 64 characters"),
});

export type VendorProductFormValues = z.infer<typeof vendorProductFormSchema>;
