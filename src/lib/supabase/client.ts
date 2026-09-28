import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { appConfig } from "../../app/config/env";
import type { Database } from "../../types/database";
import { AppError } from "../errors/app-error";

let browserClient: SupabaseClient<Database> | undefined;

export function getSupabaseClient() {
  if (!appConfig.isSupabaseConfigured) {
    throw new AppError("CONFIGURATION_ERROR");
  }

  browserClient ??= createClient<Database>(
    appConfig.supabaseUrl,
    appConfig.supabasePublishableKey,
  );

  return browserClient;
}
