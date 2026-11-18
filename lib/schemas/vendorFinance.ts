import { z } from "zod";

export const MIN_WITHDRAWAL_AMOUNT = 1_000;

/**
 * Bank details are validated again by the API. These rules mirror the backend
 * Nigerian bank constraints so mistakes surface before a round trip.
 */
export const vendorBankAccountSchema = z.object({
  bankName: z
    .string()
    .trim()
    .min(2, "Bank name is required")
    .max(120, "Keep the bank name under 120 characters"),
  bankCode: z
    .string()
    .trim()
    .regex(/^\d{3,6}$/, "Enter a valid Nigerian bank code"),
  accountName: z
    .string()
    .trim()
    .min(2, "Account name is required")
    .max(160, "Keep the account name under 160 characters"),
  accountNumber: z
    .string()
    .trim()
    .regex(/^\d{10}$/, "Enter a valid 10-digit account number"),
});

export type VendorBankAccountValues = z.infer<typeof vendorBankAccountSchema>;

export const vendorWithdrawalSchema = z.object({
  amount: z
    .number({ error: "Enter a valid Naira amount" })
    .int("Enter a whole Naira amount")
    .min(
      MIN_WITHDRAWAL_AMOUNT,
      `The minimum withdrawal is ₦${MIN_WITHDRAWAL_AMOUNT.toLocaleString("en-NG")}`,
    ),
  bankAccountId: z.string().min(1, "Choose a verified bank account"),
  note: z.string().trim().max(300, "Keep the note under 300 characters"),
});

export type VendorWithdrawalValues = z.infer<typeof vendorWithdrawalSchema>;
