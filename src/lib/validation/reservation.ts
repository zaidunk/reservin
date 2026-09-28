import { fromZonedTime } from "date-fns-tz";
import { z } from "zod";

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;
const optionalTrimmed = z
  .string()
  .trim()
  .transform((value) => (value.length === 0 ? null : value))
  .nullable()
  .optional()
  .transform((value) => value ?? null);

export const reservationSearchSchema = z
  .object({
    date: z.string().date(),
    startTime: z.string().regex(timePattern),
    endTime: z.string().regex(timePattern),
    partySize: z.coerce.number().int().positive().max(30),
  })
  .superRefine((value, context) => {
    if (value.startTime >= value.endTime) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endTime"],
        message: "End time must be later than start time.",
      });
    }
  });

export const reservationDetailsSchema = z.object({
  customerName: z.string().trim().min(1, "Enter the reservation name.").max(120),
  customerPhone: z.string().trim().min(6, "Enter a valid phone number.").max(40),
  customerEmail: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? null : value),
    z.string().trim().email("Enter a valid email address.").nullable().optional(),
  ).transform((value) => value ?? null),
  notes: optionalTrimmed.pipe(z.string().max(500).nullable()),
});

export const reservationRequestSchema = reservationDetailsSchema.extend({
  tableId: z.string().uuid(),
  partySize: z.number().int().positive(),
  startAt: z.string().datetime({ offset: true }),
  endAt: z.string().datetime({ offset: true }),
});

export type ReservationSearchInput = z.infer<typeof reservationSearchSchema>;
export type ReservationDetailsInput = z.infer<typeof reservationDetailsSchema>;

export function toReservationPeriod(
  input: ReservationSearchInput,
  timeZone: string,
) {
  const start = fromZonedTime(`${input.date}T${input.startTime}:00`, timeZone);
  const end = fromZonedTime(`${input.date}T${input.endTime}:00`, timeZone);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new Error("The selected date, time, or restaurant timezone is invalid.");
  }

  return { startAt: start.toISOString(), endAt: end.toISOString() };
}
