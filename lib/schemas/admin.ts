import { z } from "zod";
import { emailSchema, passwordSchema } from "@/lib/schemas/auth";

/**
 * Role keys are open-ended because Super Admins can create custom roles at
 * runtime. The form only enforces the API's key format.
 */
export const adminRoleKeySchema = z
  .string()
  .trim()
  .min(2, "Enter a role key.")
  .max(60, "Role keys cannot exceed 60 characters.")
  .regex(
    /^[A-Za-z][A-Za-z0-9_]*$/,
    "Use letters, numbers and underscores only, starting with a letter.",
  )
  .transform((value) => value.toUpperCase());

export const inviteAdminSchema = z.object({
  name: z.string().trim().min(3, "Enter the administrator's full name."),
  email: emailSchema,
  adminRole: z.string().trim().min(2, "Choose an administrative role."),
  reason: z.string().trim().max(500).optional(),
});

export type InviteAdminValues = z.infer<typeof inviteAdminSchema>;

export const acceptInvitationSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Confirm your password."),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });

export type AcceptInvitationValues = z.infer<typeof acceptInvitationSchema>;

export const createRoleSchema = z.object({
  key: adminRoleKeySchema,
  label: z.string().trim().min(2, "Enter a role name.").max(80),
  description: z.string().trim().max(300).optional(),
  permissions: z.array(z.string()).min(1, "Select at least one permission."),
  reason: z.string().trim().max(500).optional(),
});

export type CreateRoleValues = z.infer<typeof createRoleSchema>;

export const updateRoleSchema = z.object({
  label: z.string().trim().min(2, "Enter a role name.").max(80),
  description: z.string().trim().max(300).optional(),
  permissions: z.array(z.string()).min(1, "Select at least one permission."),
  reason: z.string().trim().max(500).optional(),
});

export type UpdateRoleValues = z.infer<typeof updateRoleSchema>;

export const changeAdminRoleSchema = z.object({
  adminRole: z.string().trim().min(2, "Choose an administrative role."),
  reason: z.string().trim().max(500).optional(),
});

export type ChangeAdminRoleValues = z.infer<typeof changeAdminRoleSchema>;

export const adminProfileSchema = z.object({
  name: z.string().trim().min(3, "Enter your full name.").max(80),
  phone: z
    .string()
    .trim()
    .max(20, "Phone number is too long.")
    .optional(),
  profilePicture: z.string().trim().max(500).optional(),
  reason: z.string().trim().max(500).optional(),
});

export type AdminProfileValues = z.infer<typeof adminProfileSchema>;
