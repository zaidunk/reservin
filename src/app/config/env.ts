const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() ?? "";
const supabasePublishableKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() ?? "";

export const appConfig = {
  restaurantTimeZone:
    import.meta.env.VITE_RESTAURANT_TIMEZONE?.trim() || "Asia/Jakarta",
  supabaseUrl,
  supabasePublishableKey,
  isSupabaseConfigured: Boolean(supabaseUrl && supabasePublishableKey),
} as const;
