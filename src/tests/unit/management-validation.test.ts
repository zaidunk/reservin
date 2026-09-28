import { describe, expect, it } from "vitest";

import {
  openingHoursSchema,
  restaurantSettingsSchema,
  tableSchema,
} from "../../lib/validation/management";

describe("tableSchema", () => {
  it("normalizes a blank optional area to null", () => {
    expect(tableSchema.parse({ code: " T04 ", name: " Patio ", capacity: "4", area: " " })).toEqual({
      code: "T04",
      name: "Patio",
      capacity: 4,
      area: null,
    });
  });
});

describe("openingHoursSchema", () => {
  it("rejects closing time that is not later than opening time", () => {
    const result = openingHoursSchema.safeParse({
      dayOfWeek: 1,
      openTime: "20:00",
      closeTime: "18:00",
      isClosed: false,
    });

    expect(result.success).toBe(false);
  });

  it("accepts a closed day without times", () => {
    expect(
      openingHoursSchema.safeParse({
        dayOfWeek: 1,
        openTime: null,
        closeTime: null,
        isClosed: true,
      }).success,
    ).toBe(true);
  });
});

describe("restaurantSettingsSchema", () => {
  it("rejects a timezone that is not an IANA identifier", () => {
    const result = restaurantSettingsSchema.safeParse({
      name: "Reservin Demo Restaurant",
      timezone: "Jakarta time",
      reservationEnabled: true,
    });

    expect(result.success).toBe(false);
  });
});
