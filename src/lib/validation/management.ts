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

function isIanaTimeZone(value: string) {
  try {
    new Intl.DateTimeFormat("en", { timeZone: value }).format();
    return true;
  } catch {
    return false;
  }
}

export const restaurantSettingsSchema = z.object({
  name: z.string().trim().min(1, "Enter the restaurant name."),
  timezone: z
    .string()
    .trim()
    .min(1, "Enter an IANA timezone.")
    .refine(isIanaTimeZone, "Enter a valid IANA timezone."),
  reservationEnabled: z.boolean(),
});

const managementTimePattern = /^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/;

export const openingHoursSchema = z
  .object({
    dayOfWeek: z.number().int().min(0).max(6),
    openTime: z.string().regex(managementTimePattern).nullable(),
    closeTime: z.string().regex(managementTimePattern).nullable(),
    isClosed: z.boolean(),
  })
  .superRefine((value, context) => {
    if (value.isClosed) return;
    if (!value.openTime || !value.closeTime || value.openTime >= value.closeTime) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["closeTime"],
        message: "Closing time must be later than opening time.",
      });
    }
  });
