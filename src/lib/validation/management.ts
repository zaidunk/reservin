import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});

export const tableSchema = z.object({
  code: z.string().trim().min(1, "Enter a table code.").max(20),
  name: z.string().trim().min(1, "Enter a table name.").max(120),
  capacity: z.coerce.number().int().positive("Capacity must be at least 1.").max(100),
  area: z
    .string()
    .trim()
    .transform((value) => (value.length === 0 ? null : value))
    .nullable(),
});

export const restaurantSettingsSchema = z.object({
  name: z.string().trim().min(1, "Enter the restaurant name."),
  timezone: z.string().trim().min(1, "Enter an IANA timezone."),
  reservationEnabled: z.boolean(),
});
