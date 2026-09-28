import type {
  OpeningHours,
  ReservationStatus,
  ReservationWithTable,
  RestaurantSettings,
  RestaurantTable,
} from "../../types/domain";
import { toAppError } from "../errors/app-error";
import { getSupabaseClient } from "../supabase/client";

export type ReservationFilters = {
  startAt: string;
  endAt: string;
  tableId?: string;
  status?: ReservationStatus;
};

export type TableInput = Pick<RestaurantTable, "code" | "name" | "capacity" | "area">;

export async function listTables(): Promise<RestaurantTable[]> {
  const { data, error } = await getSupabaseClient()
    .from("restaurant_tables")
    .select("*")
    .order("code");
  if (error) throw toAppError(error);
  return data;
}

export async function createTable(input: TableInput) {
  const { data, error } = await getSupabaseClient()
    .from("restaurant_tables")
    .insert(input)
    .select()
    .single();
  if (error) throw toAppError(error);
  return data;
}

export async function updateTable(id: string, input: Partial<TableInput>) {
  const { data, error } = await getSupabaseClient()
    .from("restaurant_tables")
    .update(input)
    .eq("id", id)
    .select()
    .single();
  if (error) throw toAppError(error);
  return data;
}

export async function setTableActive(id: string, isActive: boolean) {
  const { error } = await getSupabaseClient()
    .from("restaurant_tables")
    .update({ is_active: isActive })
    .eq("id", id);
  if (error) throw toAppError(error);
}

export async function listReservations(
  filters: ReservationFilters,
): Promise<ReservationWithTable[]> {
  let query = getSupabaseClient()
    .from("reservations")
    .select("*, restaurant_tables(code, name)")
    .gte("start_at", filters.startAt)
    .lt("start_at", filters.endAt)
    .order("start_at");

  if (filters.tableId) query = query.eq("table_id", filters.tableId);
  if (filters.status) query = query.eq("status", filters.status);

  const { data, error } = await query;
  if (error) throw toAppError(error);
  return data as ReservationWithTable[];
}

export async function updateReservationStatus(
  id: string,
  status: ReservationStatus,
) {
  const { error } = await getSupabaseClient()
    .from("reservations")
    .update({ status })
    .eq("id", id);
  if (error) throw toAppError(error);
}

export async function getRestaurantConfiguration(): Promise<{
  settings: RestaurantSettings;
  openingHours: OpeningHours[];
}> {
  const client = getSupabaseClient();
  const [settingsResult, hoursResult] = await Promise.all([
    client.from("restaurant_settings").select("*").single(),
    client.from("opening_hours").select("*").order("day_of_week"),
  ]);

  if (settingsResult.error) throw toAppError(settingsResult.error);
  if (hoursResult.error) throw toAppError(hoursResult.error);
  return { settings: settingsResult.data, openingHours: hoursResult.data };
}

export async function updateRestaurantConfiguration(input: {
  settings: Pick<RestaurantSettings, "name" | "timezone" | "reservation_enabled">;
  openingHours: Array<
    Pick<OpeningHours, "day_of_week" | "open_time" | "close_time" | "is_closed">
  >;
}) {
  const client = getSupabaseClient();
  const { data: current, error: currentError } = await client
    .from("restaurant_settings")
    .select("id")
    .single();
  if (currentError) throw toAppError(currentError);

  const [settingsResult, hoursResult] = await Promise.all([
    client.from("restaurant_settings").update(input.settings).eq("id", current.id),
    client.from("opening_hours").upsert(input.openingHours, {
      onConflict: "day_of_week",
    }),
  ]);
  if (settingsResult.error) throw toAppError(settingsResult.error);
  if (hoursResult.error) throw toAppError(hoursResult.error);
}
