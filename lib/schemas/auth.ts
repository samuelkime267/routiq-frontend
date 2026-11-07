import { z } from "zod";
import { isEmail, passwordProblems } from "@/lib/validation";

/** Shared auth field schemas so every form validates the same way. */

export const emailSchema = z
  .string()
  .trim()
  .min(1, "Enter your email address.")
  .refine(isEmail, "Enter a valid email address.");

export const passwordSchema = z
  .string()
  .min(1, "Enter a password.")
  .superRefine((value, ctx) => {
    const [problem] = passwordProblems(value);

    if (problem) {
      ctx.addIssue({ code: "custom", message: problem });
    }
  });

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password."),
});

export type LoginValues = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    name: z.string().trim().min(3, "Enter your full name."),
    username: z.string().trim().min(3, "Username must be at least 3 characters."),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Confirm your password."),
    acceptedTerms: z
      .boolean()
      .refine(Boolean, "Accept the marketplace terms to create your account."),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });

export type RegisterValues = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Confirm your password."),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });

export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

export const verifyEmailSchema = z.object({
  code: z.string().regex(/^\d{6}$/, "Enter the 6-digit code from your email."),
});

export type VerifyEmailValues = z.infer<typeof verifyEmailSchema>;
