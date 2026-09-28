import { createClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const supabaseUrl = process.env.SUPABASE_URL;
const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;
const secretKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !publishableKey || !secretKey) {
  throw new Error(
    "SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, and SUPABASE_SECRET_KEY are required.",
  );
}

const admin = createClient(supabaseUrl, secretKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const tableId = crypto.randomUUID();
const tableCode = `CONC-${crypto.randomUUID().slice(0, 8)}`;
const functionUrl = `${supabaseUrl}/functions/v1/create-reservation`;

describe("create-reservation concurrency", () => {
  beforeAll(async () => {
    const { error: settingsError } = await admin
      .from("restaurant_settings")
      .update({ reservation_enabled: true, timezone: "Asia/Jakarta" })
      .not("id", "is", null);
    if (settingsError) throw settingsError;

    const { error: tableError } = await admin.from("restaurant_tables").insert({
      id: tableId,
      code: tableCode,
      name: "Concurrency Test Table",
      capacity: 4,
      area: "indoor",
      is_active: true,
    });
    if (tableError) throw tableError;
  });

  afterAll(async () => {
    await admin.from("reservations").delete().eq("table_id", tableId);
    await admin.from("restaurant_tables").delete().eq("id", tableId);
  });

  it("allows exactly one of two conflicting writes to commit", async () => {
    const request = (suffix: string) =>
      fetch(functionUrl, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          apikey: publishableKey,
          authorization: `Bearer ${publishableKey}`,
        },
        body: JSON.stringify({
          table_id: tableId,
          customer_name: `Concurrent Customer ${suffix}`,
          customer_phone: `+62800000000${suffix}`,
          customer_email: null,
          party_size: 2,
          start_at: "2035-01-06T18:00:00+07:00",
          end_at: "2035-01-06T20:00:00+07:00",
          notes: null,
        }),
      });

    const responses = await Promise.all([request("1"), request("2")]);
    const statuses = responses.map((response) => response.status).sort();
    const bodies = await Promise.all(responses.map((response) => response.json()));

    expect(statuses).toEqual([201, 409]);
    expect(
      bodies.filter(
        (body) => body.error?.code === "TABLE_NOT_AVAILABLE",
      ),
    ).toHaveLength(1);

    const { count, error } = await admin
      .from("reservations")
      .select("id", { count: "exact", head: true })
      .eq("table_id", tableId)
      .in("status", ["confirmed", "seated"]);

    expect(error).toBeNull();
    expect(count).toBe(1);
  });
});
