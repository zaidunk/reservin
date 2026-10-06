import { useMutation } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "../../components/ui/Button";
import { ErrorNotice, LoadingState } from "../../components/ui/States";
import { appConfig } from "../../app/config/env";
import {
  createReservation,
  getAvailableTables,
} from "../../lib/api/public-reservations";
import { toAppError } from "../../lib/errors/app-error";
import { getTodayDate } from "../../lib/date/restaurant-time";
import {
  toReservationPeriod,
  type ReservationDetailsInput,
  type ReservationSearchInput,
} from "../../lib/validation/reservation";
import type { AvailableTable } from "../../types/domain";
import { ReservationSearch } from "../availability/components/ReservationSearch";
import { TableList } from "../availability/components/TableList";
import { ReservationConfirmation } from "./components/ReservationConfirmation";
import { ReservationDetailsForm } from "./components/ReservationDetailsForm";

function nextReservationDate() {
  const [year, month, day] = getTodayDate(appConfig.restaurantTimeZone).split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + 1));
  return date.toISOString().slice(0, 10);
}

const initialSearch: ReservationSearchInput = {
  date: nextReservationDate(),
  startTime: "18:00",
  endTime: "20:00",
  partySize: 2,
};

export function PublicReservationPage() {
  const [search, setSearch] = useState(initialSearch);
  const [selectedTable, setSelectedTable] = useState<AvailableTable>();
  const [customerName, setCustomerName] = useState("");
  const [step, setStep] = useState<"search" | "details" | "confirmed">("search");

  const period = useMemo(
    () => toReservationPeriod(search, appConfig.restaurantTimeZone),
    [search],
  );

  const availability = useMutation({
    mutationFn: async (input: ReservationSearchInput) => {
      const nextPeriod = toReservationPeriod(input, appConfig.restaurantTimeZone);
      return getAvailableTables({ ...nextPeriod, partySize: input.partySize });
    },
    onSuccess: (_tables, input) => {
      setSearch(input);
      setSelectedTable(undefined);
      setStep("search");
    },
  });

  const reservation = useMutation({
    mutationFn: (details: ReservationDetailsInput) =>
      createReservation({
        tableId: selectedTable!.id,
        customerName: details.customerName,
        customerPhone: details.customerPhone,
        customerEmail: details.customerEmail,
        notes: details.notes,
        partySize: search.partySize,
        ...period,
      }),
    onSuccess: (_result, details) => {
      setCustomerName(details.customerName);
      setStep("confirmed");
    },
  });

  if (step === "confirmed" && reservation.data && selectedTable) {
    return (
      <main className="public-main public-main--centered">
        <ReservationConfirmation
          result={reservation.data}
          table={selectedTable}
          partySize={search.partySize}
          customerName={customerName}
          onRestart={() => {
            reservation.reset();
            availability.reset();
            setSelectedTable(undefined);
            setStep("search");
          }}
        />
      </main>
    );
  }

  return (
    <main className="public-main">
      <section className="reservation-hero">
        <div className="reservation-hero__copy">
          <h1>A table is waiting.</h1>
          <p>
            Choose your time, find the right table, and arrive knowing everything is set.
          </p>
        </div>
        <ol className="flow-steps" aria-label="Reservation progress">
          <li className="flow-step flow-step--active"><span>1</span> When</li>
          <li className={availability.data ? "flow-step flow-step--active" : "flow-step"}><span>2</span> Table</li>
          <li className={step === "details" ? "flow-step flow-step--active" : "flow-step"}><span>3</span> Details</li>
        </ol>
      </section>

      <section className="booking-surface" id="reserve" aria-labelledby="booking-title">
        <div className="section-heading">
          <div>
            <h2 id="booking-title">When are you coming?</h2>
          </div>
          {availability.data ? (
            <Button variant="ghost" onClick={() => availability.reset()}>
              Clear search
            </Button>
          ) : null}
        </div>
        <ReservationSearch
          initialValue={search}
          isLoading={availability.isPending}
          onSearch={(input) => availability.mutate(input)}
        />
        {availability.error ? (
          <ErrorNotice message={toAppError(availability.error).message} />
        ) : null}
      </section>

      {availability.isPending ? <LoadingState label="Finding available tables" /> : null}

      {availability.data ? (
        <section className="booking-stage" aria-labelledby="tables-title">
          <div className="section-heading">
            <div>
              <h2 id="tables-title">Choose your table.</h2>
              <p>
                {search.date} · {search.startTime}–{search.endTime} · {search.partySize} guests
              </p>
            </div>
          </div>
          <TableList
            tables={availability.data}
            selectedId={selectedTable?.id}
            onSelect={(table) => {
              setSelectedTable(table);
              reservation.reset();
            }}
          />
          {selectedTable && step === "search" ? (
            <div className="selection-bar">
              <div>
                <strong>{selectedTable.name} · {selectedTable.code}</strong>
              </div>
              <Button size="large" onClick={() => setStep("details")}>
                Continue <ArrowRight size={17} aria-hidden="true" />
              </Button>
            </div>
          ) : null}
        </section>
      ) : null}

      {step === "details" && selectedTable ? (
        <section className="booking-stage details-stage" aria-labelledby="details-title">
          <div className="section-heading">
            <div>
              <h2 id="details-title">Who is the reservation for?</h2>
              <p>{selectedTable.name} · {search.startTime}–{search.endTime}</p>
            </div>
          </div>
          {reservation.error ? (
            <ErrorNotice message={toAppError(reservation.error).message} />
          ) : null}
          <ReservationDetailsForm
            isLoading={reservation.isPending}
            onBack={() => setStep("search")}
            onSubmit={(details) => reservation.mutate(details)}
          />
        </section>
      ) : null}
    </main>
  );
}
