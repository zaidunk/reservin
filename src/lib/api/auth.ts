import type { Session } from "@supabase/supabase-js";

import { AppError, toAppError } from "../errors/app-error";
import { getSupabaseClient } from "../supabase/client";

export async function signIn(email: string, password: string) {
  const { data, error } = await getSupabaseClient().auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw new AppError("UNAUTHORIZED", "Email or password is incorrect.");
  return data.session;
}

export async function signOut() {
  const { error } = await getSupabaseClient().auth.signOut();
  if (error) throw toAppError(error);
}

export async function getCurrentSession(): Promise<Session | null> {
  const { data, error } = await getSupabaseClient().auth.getSession();
  if (error) throw toAppError(error);
  return data.session;
}

export async function isStaffUser(userId: string) {
  const { data, error } = await getSupabaseClient()
    .from("staff_users")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw toAppError(error);
  return Boolean(data);
}
