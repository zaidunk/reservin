import { CalendarDays, Check, Clock3, Hash, Users } from "lucide-react";

import { Button } from "../../../components/ui/Button";
import { appConfig } from "../../../app/config/env";
import type { AvailableTable, ReservationResult } from "../../../types/domain";

export function ReservationConfirmation({
  result,
  table,
  partySize,
  customerName,
  onRestart,
}: {
  result: ReservationResult;
  table: AvailableTable;
  partySize: number;
  customerName: string;
  onRestart: () => void;
}) {
  const start = new Date(result.start_at);
  const end = new Date(result.end_at);
  const dateFormatter = new Intl.DateTimeFormat("en", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: appConfig.restaurantTimeZone,
  });
  const timeFormatter = new Intl.DateTimeFormat("en", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: appConfig.restaurantTimeZone,
  });

  return (
    <section className="confirmation" aria-labelledby="confirmation-title">
      <div className="confirmation__icon">
        <Check size={28} aria-hidden="true" />
      </div>
      <h1 id="confirmation-title">Your table is reserved.</h1>
      <p className="confirmation__lead">We’ll have everything ready for {customerName}.</p>
      <dl className="confirmation__details">
        <div>
          <CalendarDays size={18} aria-hidden="true" />
          <dt>Date</dt>
          <dd>{dateFormatter.format(start)}</dd>
        </div>
        <div>
          <Clock3 size={18} aria-hidden="true" />
          <dt>Time</dt>
          <dd>
            {timeFormatter.format(start)}–{timeFormatter.format(end)}
          </dd>
        </div>
        <div>
          <Users size={18} aria-hidden="true" />
          <dt>Table</dt>
          <dd>
            {table.name} · {table.code} · {partySize} guests
          </dd>
        </div>
        <div>
          <Hash size={18} aria-hidden="true" />
          <dt>Confirmation</dt>
          <dd>{result.confirmation_code}</dd>
        </div>
      </dl>
      <Button variant="secondary" onClick={onRestart}>
        Make another reservation
      </Button>
    </section>
  );
}
