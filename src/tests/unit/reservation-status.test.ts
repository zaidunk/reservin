import { describe, expect, it } from "vitest";

import { getNextReservationStatuses } from "../../features/reservation-management/reservation-status";

describe("getNextReservationStatuses", () => {
  it("offers operational actions for a confirmed reservation", () => {
    expect(getNextReservationStatuses("confirmed")).toEqual([
      "seated",
      "cancelled",
      "no_show",
    ]);
  });

  it("does not offer transitions from terminal states", () => {
    expect(getNextReservationStatuses("completed")).toEqual([]);
    expect(getNextReservationStatuses("cancelled")).toEqual([]);
    expect(getNextReservationStatuses("no_show")).toEqual([]);
  });
});
