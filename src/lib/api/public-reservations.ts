import {
  FunctionsFetchError,
  FunctionsHttpError,
  FunctionsRelayError,
} from "@supabase/supabase-js";

import type { AvailableTable, ReservationResult } from "../../types/domain";
import { AppError, toAppError } from "../errors/app-error";
import { getSupabaseClient } from "../supabase/client";
import { reservationRequestSchema } from "../validation/reservation";

export type AvailabilityRequest = {
  startAt: string;
  endAt: string;
  partySize: number;
};

export type CreateReservationRequest = AvailabilityRequest & {
  tableId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  notes: string | null;
};

export async function getAvailableTables(
  request: AvailabilityRequest,
): Promise<AvailableTable[]> {
  const { data, error } = await getSupabaseClient().rpc("get_available_tables", {
    start_at: request.startAt,
    end_at: request.endAt,
    party_size: request.partySize,
  });

  if (error) throw toAppError(error);
  return data ?? [];
}

export async function createReservation(
  request: CreateReservationRequest,
): Promise<ReservationResult> {
  const input = reservationRequestSchema.parse(request);
  const { data, error } = await getSupabaseClient().functions.invoke<
    ReservationResult | { error: { code: string; message: string } }
  >("create-reservation", {
    body: {
      table_id: input.tableId,
      customer_name: input.customerName,
      customer_phone: input.customerPhone,
      customer_email: input.customerEmail,
      party_size: input.partySize,
      start_at: input.startAt,
      end_at: input.endAt,
      notes: input.notes,
    },
  });

  if (error instanceof FunctionsHttpError) {
    let responseBody: unknown;
    try {
      responseBody = await error.context.json();
    } catch {
      throw new AppError("INTERNAL_ERROR");
    }
    throw toAppError(responseBody);
  }

  if (error instanceof FunctionsFetchError || error instanceof FunctionsRelayError) {
    throw new AppError("INTERNAL_ERROR");
  }

  if (error) throw toAppError(error);
  if (!data || "error" in data) throw toAppError(data);
  return data;
}
