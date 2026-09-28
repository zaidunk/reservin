import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { createClient } from "@supabase/supabase-js";

import {
  createReservationHandler,
  type ReservationInput,
  type ReservationResult,
} from "./handler.ts";

type DatabaseError = {
  code?: string;
  message?: string;
};

const knownDatabaseErrors = new Set([
  "INVALID_INPUT",
  "INVALID_TIME_RANGE",
  "OUTSIDE_OPENING_HOURS",
  "CAPACITY_EXCEEDED",
  "TABLE_NOT_FOUND",
  "TABLE_NOT_AVAILABLE",
  "RESERVATIONS_DISABLED",
]);

const errorMessages: Record<string, string> = {
  INVALID_INPUT: "The reservation request is malformed or incomplete.",
  INVALID_TIME_RANGE: "start_at must be earlier than end_at.",
  OUTSIDE_OPENING_HOURS:
    "The requested period is outside restaurant opening hours.",
  CAPACITY_EXCEEDED: "The party size exceeds the selected table capacity.",
  TABLE_NOT_FOUND: "The requested table does not exist.",
  TABLE_NOT_AVAILABLE:
    "The selected table is not available for the requested period.",
  RESERVATIONS_DISABLED:
    "The restaurant is temporarily not accepting reservations.",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Required Supabase environment variables are not configured.");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const createReservation = async (
  input: ReservationInput,
): Promise<ReservationResult> => {
  const { data, error } = await supabase.rpc("create_reservation", {
    p_table_id: input.table_id,
    p_customer_name: input.customer_name,
    p_customer_phone: input.customer_phone,
    p_customer_email: input.customer_email ?? null,
    p_party_size: input.party_size,
    p_start_at: input.start_at,
    p_end_at: input.end_at,
    p_notes: input.notes ?? null,
  });

  if (error) {
    const databaseError = error as DatabaseError;
    const code = databaseError.message;

    if (code && knownDatabaseErrors.has(code)) {
      throw { code, message: errorMessages[code] };
    }

    throw error;
  }

  const reservation = Array.isArray(data) ? data[0] : data;
  if (!reservation) {
    throw new Error("Reservation creation returned no result.");
  }

  return reservation as ReservationResult;
};

const logger = {
  info: (event: Record<string, unknown>) => console.log(JSON.stringify(event)),
  error: (event: Record<string, unknown>) => console.error(JSON.stringify(event)),
};

Deno.serve(createReservationHandler({ createReservation, logger }));
