import { describe, expect, it } from "vitest";

import {
  reservationDetailsSchema,
  reservationSearchSchema,
  toReservationPeriod,
} from "../../lib/validation/reservation";

describe("reservationSearchSchema", () => {
  it("accepts a valid flexible reservation period", () => {
    const result = reservationSearchSchema.safeParse({
      date: "2026-10-02",
      startTime: "18:00",
      endTime: "20:00",
      partySize: 4,
    });

    expect(result.success).toBe(true);
  });

  it("rejects a period that does not end after it starts", () => {
    const result = reservationSearchSchema.safeParse({
      date: "2026-10-02",
      startTime: "20:00",
      endTime: "20:00",
      partySize: 4,
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(["endTime"]);
  });
});

describe("reservationDetailsSchema", () => {
  it("normalizes optional blank fields to null", () => {
    const result = reservationDetailsSchema.parse({
      customerName: "  Zaidan Daffa  ",
      customerPhone: " 0812 3456 7890 ",
      customerEmail: " ",
      notes: " ",
    });

    expect(result).toEqual({
      customerName: "Zaidan Daffa",
      customerPhone: "0812 3456 7890",
      customerEmail: null,
      notes: null,
    });
  });
});

describe("toReservationPeriod", () => {
  it("converts restaurant wall time to stable UTC timestamps", () => {
    expect(
      toReservationPeriod(
        {
          date: "2026-10-02",
          startTime: "18:00",
          endTime: "20:00",
          partySize: 4,
        },
        "Asia/Jakarta",
      ),
    ).toEqual({
      startAt: "2026-10-02T11:00:00.000Z",
      endAt: "2026-10-02T13:00:00.000Z",
    });
  });
});
