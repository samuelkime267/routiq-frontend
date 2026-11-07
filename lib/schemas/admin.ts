import { z } from "zod";
import { emailSchema } from "@/lib/schemas/auth";

const ADMIN_ROLE_VALUES = [
  "SUPER_ADMIN",
  "OPERATIONS_ADMIN",
  "FINANCE_ADMIN",
  "SUPPORT_ADMIN",
  "CATALOG_ADMIN",
] as const;

export const inviteAdminSchema = z.object({
  name: z.string().trim().min(3, "Enter the administrator's full name."),
  email: emailSchema,
  adminRole: z.enum(ADMIN_ROLE_VALUES),
});

export type InviteAdminValues = z.infer<typeof inviteAdminSchema>;
