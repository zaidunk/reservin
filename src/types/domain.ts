import type { Database, ReservationStatus } from "./database";

export type AvailableTable =
  Database["public"]["Functions"]["get_available_tables"]["Returns"][number];
export type RestaurantTable = Database["public"]["Tables"]["restaurant_tables"]["Row"];
export type RestaurantSettings =
  Database["public"]["Tables"]["restaurant_settings"]["Row"];
export type OpeningHours = Database["public"]["Tables"]["opening_hours"]["Row"];
export type Reservation = Database["public"]["Tables"]["reservations"]["Row"];

export type ReservationWithTable = Reservation & {
  restaurant_tables: Pick<RestaurantTable, "code" | "name"> | null;
};

export type ReservationResult = {
  reservation_id: string;
  confirmation_code: string;
  status: "confirmed";
  table_id: string;
  start_at: string;
  end_at: string;
};

export type { ReservationStatus };
