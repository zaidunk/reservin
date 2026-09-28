// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { PublicReservationPage } from "../../features/reservation/PublicReservationPage";
import { createReservation, getAvailableTables } from "../../lib/api/public-reservations";

vi.mock("../../lib/api/public-reservations", () => ({
  getAvailableTables: vi.fn(),
  createReservation: vi.fn(),
}));

describe("public reservation flow", () => {
  it("moves from availability search to a calm confirmation", async () => {
    const user = userEvent.setup();
    vi.mocked(getAvailableTables).mockResolvedValue([
      { id: "7dc89eb6-7f12-4db3-b7a2-5d0919cd0aa4", code: "T03", name: "Window Table", capacity: 6, area: "indoor" },
    ]);
    vi.mocked(createReservation).mockResolvedValue({
      reservation_id: "ebfce7a6-23e1-49c9-ad7a-7de41621ec63",
      confirmation_code: "RSV-TEST123",
      status: "confirmed",
      table_id: "7dc89eb6-7f12-4db3-b7a2-5d0919cd0aa4",
      start_at: "2026-10-02T11:00:00.000Z",
      end_at: "2026-10-02T13:00:00.000Z",
    });

    const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    render(
      <QueryClientProvider client={queryClient}>
        <PublicReservationPage />
      </QueryClientProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Find a table" }));
    await user.click(await screen.findByRole("button", { name: /Window Table/ }));
    await user.click(screen.getByRole("button", { name: /Continue/ }));
    await user.type(screen.getByLabelText("Reservation name"), "Zaidan Daffa");
    await user.type(screen.getByLabelText("Phone number"), "081234567890");
    await user.click(screen.getByRole("button", { name: "Reserve this table" }));

    expect(await screen.findByRole("heading", { name: "Your table is reserved." })).toBeVisible();
    expect(screen.getByText("RSV-TEST123")).toBeVisible();
  });
});
