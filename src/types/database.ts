export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type ReservationStatus =
  | "confirmed"
  | "seated"
  | "completed"
  | "cancelled"
  | "no_show";

export interface Database {
  public: {
    Tables: {
      restaurant_settings: {
        Row: {
          id: string;
          name: string;
          timezone: string;
          reservation_enabled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          timezone: string;
          reservation_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          timezone?: string;
          reservation_enabled?: boolean;
        };
        Relationships: [];
      };
      opening_hours: {
        Row: {
          id: string;
          day_of_week: number;
          open_time: string | null;
          close_time: string | null;
          is_closed: boolean;
        };
        Insert: {
          id?: string;
          day_of_week: number;
          open_time?: string | null;
          close_time?: string | null;
          is_closed?: boolean;
        };
        Update: {
          day_of_week?: number;
          open_time?: string | null;
          close_time?: string | null;
          is_closed?: boolean;
        };
        Relationships: [];
      };
      restaurant_tables: {
        Row: {
          id: string;
          code: string;
          name: string;
          capacity: number;
          area: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          name: string;
          capacity: number;
          area?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          code?: string;
          name?: string;
          capacity?: number;
          area?: string | null;
          is_active?: boolean;
        };
        Relationships: [];
      };
      staff_users: {
        Row: { user_id: string; created_at: string };
        Insert: { user_id: string; created_at?: string };
        Update: never;
        Relationships: [];
      };
      reservations: {
        Row: {
          id: string;
          confirmation_code: string;
          table_id: string;
          customer_name: string;
          customer_phone: string;
          customer_email: string | null;
          party_size: number;
          start_at: string;
          end_at: string;
          status: ReservationStatus;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: never;
        Update: { status?: ReservationStatus };
        Relationships: [
          {
            foreignKeyName: "reservations_table_id_fkey";
            columns: ["table_id"];
            isOneToOne: false;
            referencedRelation: "restaurant_tables";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_available_tables: {
        Args: { start_at: string; end_at: string; party_size: number };
        Returns: Array<{
          id: string;
          code: string;
          name: string;
          capacity: number;
          area: string | null;
        }>;
      };
    };
    Enums: { reservation_status: ReservationStatus };
    CompositeTypes: Record<string, never>;
  };
}
