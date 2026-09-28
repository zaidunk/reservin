// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ReservationSearch } from "../../features/availability/components/ReservationSearch";

describe("ReservationSearch", () => {
  it("submits a complete flexible-time search", async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(
      <ReservationSearch
        initialValue={{
          date: "2026-10-02",
          startTime: "18:00",
          endTime: "20:00",
          partySize: 2,
        }}
        onSearch={onSearch}
      />,
    );

    await user.selectOptions(screen.getByLabelText("Party size"), "4");
    await user.click(screen.getByRole("button", { name: "Find a table" }));

    expect(onSearch).toHaveBeenCalledWith({
      date: "2026-10-02",
      startTime: "18:00",
      endTime: "20:00",
      partySize: 4,
    });
  });

  it("shows an inline error for an invalid time range", async () => {
    const user = userEvent.setup();
    render(
      <ReservationSearch
        initialValue={{
          date: "2026-10-02",
          startTime: "20:00",
          endTime: "20:00",
          partySize: 2,
        }}
        onSearch={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Find a table" }));

    expect(screen.getByText("End time must be later than start time.")).toBeVisible();
  });
});
