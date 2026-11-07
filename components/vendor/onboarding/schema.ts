import { z } from "zod";
import type { Path } from "react-hook-form";
import {
  ageOnDate,
  isEmail,
  isHttpUrl,
  isIsoDate,
  isNigerianPhone,
} from "@/lib/validation";
import { REQUIRED_DOCUMENTS } from "./constants";

const businessTypeSchema = z.enum([
  "individual",
  "sole_proprietorship",
  "partnership",
  "limited_company",
  "other",
]);

const idTypeSchema = z.enum([
  "nin",
  "bvn",
  "passport",
  "drivers_license",
  "voters_card",
]);

const operatingDaySchema = z.enum([
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
]);

const documentTypeSchema = z.enum([
  "cac_certificate",
  "business_name_certificate",
  "tin_certificate",
  "utility_bill",
  "government_id",
  "bank_statement",
  "other",
]);

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

const operatingHourSchema = z
  .object({
    day: operatingDaySchema,
    isOpen: z.boolean(),
    openingTime: z.string(),
    closingTime: z.string(),
  })
  .superRefine((entry, ctx) => {
    if (!entry.isOpen) return;

    if (!timePattern.test(entry.openingTime)) {
      ctx.addIssue({
        code: "custom",
        path: ["openingTime"],
        message: "Opening time is required.",
      });
    }

    if (!timePattern.test(entry.closingTime)) {
      ctx.addIssue({
        code: "custom",
        path: ["closingTime"],
        message: "Closing time is required.",
      });
    } else if (entry.openingTime >= entry.closingTime) {
      ctx.addIssue({
        code: "custom",
        path: ["closingTime"],
        message: "Closing time must be after opening time.",
      });
    }
  });

const documentSchema = z.object({
  type: documentTypeSchema,
  url: z.string().refine(isHttpUrl, "Upload this document again."),
  name: z.string(),
});

const coordinateSchema = (min: number, max: number, label: string) =>
  z.string().superRefine((value, ctx) => {
    const number = Number(value);

    if (!value.trim() || Number.isNaN(number) || number < min || number > max) {
      ctx.addIssue({
        code: "custom",
        message: `${label} must be between ${min} and ${max}.`,
      });
    }
  });

export const onboardingSchema = z
  .object({
    name: z.string().trim().min(3, "Store name must be at least 3 characters."),
    legalBusinessName: z
      .string()
      .trim()
      .min(3, "Registered business name is required."),
    businessType: businessTypeSchema,
    category: z.string().trim().min(2, "Add a business category."),
    description: z.string(),
    email: z
      .string()
      .trim()
      .refine(isEmail, "Enter a valid store email address."),
    phoneNumber: z
      .string()
      .trim()
      .refine(isNigerianPhone, "Use a valid Nigerian phone number."),
    cacRegistrationNumber: z.string(),
    tin: z.string(),
    scumlNumber: z.string(),
    businessRegistrationDate: z.string(),
    logo: z.string(),
    coverImage: z.string(),
    address: z.object({
      street: z.string().trim().min(3, "Street address is required."),
      city: z.string().trim().min(2, "City is required."),
      lga: z.string().trim().min(2, "Local government area is required."),
      state: z.string().min(1, "Select a state."),
      country: z.string(),
      landmark: z.string(),
      postalCode: z.string(),
    }),
    longitude: coordinateSchema(-180, 180, "Longitude"),
    latitude: coordinateSchema(-90, 90, "Latitude"),
    operatingHours: z
      .array(operatingHourSchema)
      .refine((entries) => entries.some((entry) => entry.isOpen), {
        message: "Pick at least one open day.",
      }),
    pickupInstructions: z.string(),
    representative: z
      .object({
        fullName: z
          .string()
          .trim()
          .min(3, "Representative name is required."),
        dateOfBirth: z.string().superRefine((value, ctx) => {
          if (!isIsoDate(value)) {
            ctx.addIssue({
              code: "custom",
              message: "Enter a valid date of birth.",
            });
            return;
          }

          const age = ageOnDate(value);

          if (age === null || age < 18) {
            ctx.addIssue({
              code: "custom",
              message: "The representative must be at least 18.",
            });
          }
        }),
        nationality: z.string(),
        idType: idTypeSchema,
        idNumber: z.string().trim().min(4, "Enter the ID number."),
        nin: z.string(),
        bvn: z.string(),
      })
      .superRefine((representative, ctx) => {
        if (!representative.nin.trim() && !representative.bvn.trim()) {
          ctx.addIssue({
            code: "custom",
            path: ["nin"],
            message: "Provide either a NIN or BVN.",
          });
        }

        if (
          representative.nin.trim() &&
          !/^\d{11}$/.test(representative.nin.trim())
        ) {
          ctx.addIssue({
            code: "custom",
            path: ["nin"],
            message: "NIN must be 11 digits.",
          });
        }

        if (
          representative.bvn.trim() &&
          !/^\d{11}$/.test(representative.bvn.trim())
        ) {
          ctx.addIssue({
            code: "custom",
            path: ["bvn"],
            message: "BVN must be 11 digits.",
          });
        }
      }),
    settlementAccount: z.object({
      bankName: z.string().trim().min(2, "Bank name is required."),
      bankCode: z
        .string()
        .trim()
        .regex(/^\d{3,6}$/, "Enter the 3-6 digit bank code."),
      accountName: z.string().trim().min(3, "Account name is required."),
      accountNumber: z
        .string()
        .trim()
        .regex(/^\d{10}$/, "Account number must be 10 digits."),
    }),
    documents: z.array(documentSchema),
    compliance: z.object({
      termsAccepted: z
        .boolean()
        .refine(Boolean, "Accept the marketplace terms."),
      dataProcessingConsent: z
        .boolean()
        .refine(Boolean, "Consent to KYB data processing to continue."),
    }),
  })
  .superRefine((form, ctx) => {
    const registered = form.businessType !== "individual";

    if (
      registered &&
      !/^(RC|BN|IT)?\d{4,10}$/i.test(form.cacRegistrationNumber.trim())
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["cacRegistrationNumber"],
        message: "Enter a valid CAC RC, BN, or IT number.",
      });
    }

    if (registered && !/^\d{8,15}$/.test(form.tin.trim())) {
      ctx.addIssue({
        code: "custom",
        path: ["tin"],
        message: "TIN must be 8 to 15 digits.",
      });
    }

    if (
      form.scumlNumber.trim() &&
      !/^[A-Z0-9-]{4,20}$/i.test(form.scumlNumber.trim())
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["scumlNumber"],
        message: "Enter a valid SCUML number.",
      });
    }

    if (
      form.businessRegistrationDate &&
      !isIsoDate(form.businessRegistrationDate)
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["businessRegistrationDate"],
        message: "Use a valid registration date.",
      });
    }

    const uploadedTypes = form.documents
      .filter((document) => isHttpUrl(document.url))
      .map((document) => document.type);

    const missing = REQUIRED_DOCUMENTS.filter(
      (type) => !uploadedTypes.includes(type),
    );

    if (missing.length) {
      ctx.addIssue({
        code: "custom",
        path: ["documents"],
        message: "Upload the required documents.",
      });
    } else if (
      registered &&
      !uploadedTypes.includes("cac_certificate") &&
      !uploadedTypes.includes("business_name_certificate")
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["documents"],
        message: "Upload a CAC or business name certificate.",
      });
    }
  });

export type StoreFormState = z.infer<typeof onboardingSchema>;
export type FormOperatingHour = StoreFormState["operatingHours"][number];
export type FormDocument = StoreFormState["documents"][number];

/** Fields validated when the vendor advances past each onboarding step. */
export const ONBOARDING_STEP_FIELDS: Path<StoreFormState>[][] = [
  [
    "name",
    "legalBusinessName",
    "businessType",
    "category",
    "description",
    "email",
    "phoneNumber",
    "cacRegistrationNumber",
    "tin",
    "scumlNumber",
    "businessRegistrationDate",
  ],
  [
    "address.street",
    "address.city",
    "address.lga",
    "address.state",
    "address.country",
    "address.landmark",
    "address.postalCode",
    "longitude",
    "latitude",
    "pickupInstructions",
  ],
  ["operatingHours"],
  [
    "representative.fullName",
    "representative.dateOfBirth",
    "representative.nationality",
    "representative.idType",
    "representative.idNumber",
    "representative.nin",
    "representative.bvn",
  ],
  [
    "settlementAccount.bankName",
    "settlementAccount.bankCode",
    "settlementAccount.accountName",
    "settlementAccount.accountNumber",
  ],
  ["documents"],
  ["compliance.termsAccepted", "compliance.dataProcessingConsent"],
];
