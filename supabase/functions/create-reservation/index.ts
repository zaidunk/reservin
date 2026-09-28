import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const json = (body: unknown, status = 501) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

Deno.serve(async (_request) => {
  // Business validation and the atomic reservation insert are the next slice.
  return json({
    error: {
      code: "NOT_IMPLEMENTED",
      message: "Reservation creation is not implemented yet.",
    },
  });
});
