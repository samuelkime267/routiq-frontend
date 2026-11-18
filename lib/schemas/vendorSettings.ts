import { z } from "zod";

const NIGERIAN_PHONE = /^(?:\+234|0)[789][01]\d{8}$/;

const phone = (requiredMessage: string) =>
  z
    .string()
    .trim()
    .min(1, requiredMessage)
    .regex(NIGERIAN_PHONE, "Enter a valid Nigerian phone number");

const optionalPhone = z
  .string()
  .trim()
  .refine(
    (value) => value === "" || NIGERIAN_PHONE.test(value),
    "Enter a valid Nigerian phone number",
  );

const optionalUrl = z
  .string()
  .trim()
  .refine(
    (value) => value === "" || /^https?:\/\/.+/i.test(value),
    "Enter a URL that starts with http:// or https://",
  );

export const OPERATING_DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

const operatingHourSchema = z
  .object({
    day: z.enum(OPERATING_DAYS),
    isOpen: z.boolean(),
    openingTime: z.string(),
    closingTime: z.string(),
  })
  .superRefine((hour, ctx) => {
    if (!hour.isOpen) return;

    if (!hour.openingTime) {
      ctx.addIssue({
        code: "custom",
        path: ["openingTime"],
        message: "Opening time is required",
      });
    }
    if (!hour.closingTime) {
      ctx.addIssue({
        code: "custom",
        path: ["closingTime"],
        message: "Closing time is required",
      });
    }
    if (
      hour.openingTime &&
      hour.closingTime &&
      hour.openingTime >= hour.closingTime
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["closingTime"],
        message: "Closing time must be after opening time",
      });
    }
  });

export const vendorSettingsSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Your name is required")
    .max(120, "Keep your name under 120 characters"),
  phone: optionalPhone,
  profilePicture: optionalUrl,
  description: z
    .string()
    .trim()
    .max(1000, "Keep the description under 1,000 characters"),
  phoneNumber: phone("A store phone number is required"),
  logo: optionalUrl,
  coverImage: optionalUrl,
  pickupInstructions: z
    .string()
    .trim()
    .max(1000, "Keep pickup instructions under 1,000 characters"),
  operatingHours: z.array(operatingHourSchema).length(7),
});

export type VendorSettingsValues = z.infer<typeof vendorSettingsSchema>;
