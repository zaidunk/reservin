import { describe, expect, it, vi } from "vitest";

import {
  createReservationHandler,
  type ReservationResult,
} from "../supabase/functions/create-reservation/handler.js";

const validBody = {
  table_id: "11111111-1111-4111-8111-111111111111",
  customer_name: "Zaidu",
  customer_phone: "+628123456789",
  customer_email: "zaidu@example.com",
  party_size: 4,
  start_at: "2026-10-10T18:00:00+07:00",
  end_at: "2026-10-10T20:00:00+07:00",
  notes: null,
};

const reservation: ReservationResult = {
  reservation_id: "22222222-2222-4222-8222-222222222222",
  confirmation_code: "RSV-ABC123DEF456",
  status: "confirmed",
  table_id: validBody.table_id,
  start_at: "2026-10-10T11:00:00+00:00",
  end_at: "2026-10-10T13:00:00+00:00",
};

describe("create-reservation handler", () => {
  it("handles browser CORS preflight requests", async () => {
    const createReservation = vi.fn();
    const handler = createReservationHandler({
      createReservation,
      logger: { info: vi.fn(), error: vi.fn() },
      createRequestId: () => "request-cors",
    });

    const response = await handler(
      new Request("http://localhost/create-reservation", {
        method: "OPTIONS",
        headers: {
          origin: "https://reservin-pearl.vercel.app",
          "access-control-request-method": "POST",
          "access-control-request-headers": "authorization,apikey,content-type",
        },
      }),
    );

    expect(response.status).toBe(204);
    expect(response.headers.get("access-control-allow-origin")).toBe("*");
    expect(response.headers.get("access-control-allow-methods")).toContain("POST");
    expect(response.headers.get("access-control-allow-headers")).toContain("authorization");
    expect(createReservation).not.toHaveBeenCalled();
  });

  it("creates a confirmed reservation from valid input", async () => {
    const createReservation = vi.fn().mockResolvedValue(reservation);
    const handler = createReservationHandler({
      createReservation,
      logger: { info: vi.fn(), error: vi.fn() },
      createRequestId: () => "request-1",
    });

    const response = await handler(
      new Request("http://localhost/create-reservation", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(validBody),
      }),
    );

    expect(response.status).toBe(201);
    expect(response.headers.get("access-control-allow-origin")).toBe("*");
    await expect(response.json()).resolves.toEqual(reservation);
    expect(createReservation).toHaveBeenCalledWith(validBody);
  });

  it.each([
    ["missing customer name", { ...validBody, customer_name: "" }],
    ["missing customer phone", { ...validBody, customer_phone: "" }],
    ["invalid email", { ...validBody, customer_email: "not-an-email" }],
    ["non-positive party size", { ...validBody, party_size: 0 }],
    ["non-integer party size", { ...validBody, party_size: 2.5 }],
    ["invalid table id", { ...validBody, table_id: "not-a-uuid" }],
    ["timestamp without timezone", { ...validBody, start_at: "2026-10-10T18:00:00" }],
    ["client-supplied status", { ...validBody, status: "seated" }],
  ])("rejects %s", async (_name, body) => {
    const createReservation = vi.fn();
    const handler = createReservationHandler({
      createReservation,
      logger: { info: vi.fn(), error: vi.fn() },
      createRequestId: () => "request-2",
    });

    const response = await handler(
      new Request("http://localhost/create-reservation", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: { code: "INVALID_INPUT" },
    });
    expect(createReservation).not.toHaveBeenCalled();
  });

  it("rejects a reversed time range before querying the database", async () => {
    const createReservation = vi.fn();
    const handler = createReservationHandler({
      createReservation,
      logger: { info: vi.fn(), error: vi.fn() },
      createRequestId: () => "request-3",
    });

    const response = await handler(
      new Request("http://localhost/create-reservation", {
        method: "POST",
        body: JSON.stringify({
          ...validBody,
          start_at: "2026-10-10T20:00:00+07:00",
          end_at: "2026-10-10T18:00:00+07:00",
        }),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: { code: "INVALID_TIME_RANGE" },
    });
    expect(createReservation).not.toHaveBeenCalled();
  });

  it.each([
    ["OUTSIDE_OPENING_HOURS", 400],
    ["CAPACITY_EXCEEDED", 400],
    ["TABLE_NOT_FOUND", 404],
    ["TABLE_NOT_AVAILABLE", 409],
    ["RESERVATIONS_DISABLED", 503],
  ])("maps %s to HTTP %i", async (code, status) => {
    const createReservation = vi.fn().mockRejectedValue({
      code,
      message: "Safe message",
    });
    const handler = createReservationHandler({
      createReservation,
      logger: { info: vi.fn(), error: vi.fn() },
      createRequestId: () => "request-4",
    });

    const response = await handler(
      new Request("http://localhost/create-reservation", {
        method: "POST",
        body: JSON.stringify(validBody),
      }),
    );

    expect(response.status).toBe(status);
    await expect(response.json()).resolves.toEqual({
      error: { code, message: "Safe message" },
      request_id: "request-4",
    });
  });

  it("does not expose unexpected server errors", async () => {
    const createReservation = vi
      .fn()
      .mockRejectedValue(new Error("database password leaked"));
    const handler = createReservationHandler({
      createReservation,
      logger: { info: vi.fn(), error: vi.fn() },
      createRequestId: () => "request-5",
    });

    const response = await handler(
      new Request("http://localhost/create-reservation", {
        method: "POST",
        body: JSON.stringify(validBody),
      }),
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected server error occurred.",
      },
      request_id: "request-5",
    });
  });
});
