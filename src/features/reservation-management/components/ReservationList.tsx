import { Clock3, Mail, Phone, Users } from "lucide-react";

import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { EmptyState } from "../../../components/ui/States";
import { appConfig } from "../../../app/config/env";
import { formatRestaurantTime } from "../../../lib/date/restaurant-time";
import type { ReservationStatus, ReservationWithTable } from "../../../types/domain";
import {
  getNextReservationStatuses,
  reservationStatusLabels,
  reservationStatusTones,
} from "../reservation-status";

export function ReservationList({
  reservations,
  updatingId,
  onStatusChange,
}: {
  reservations: ReservationWithTable[];
  updatingId?: string;
  onStatusChange?: (reservation: ReservationWithTable, status: ReservationStatus) => void;
}) {
  if (reservations.length === 0) {
    return <EmptyState title="No reservations yet." message="Reservations for this day will appear here." />;
  }

  return (
    <div className="reservation-list" role="list">
      {reservations.map((reservation) => (
        <article className="reservation-row" key={reservation.id} role="listitem">
          <div className="reservation-row__time">
            <Clock3 size={16} aria-hidden="true" />
            <strong>{formatRestaurantTime(reservation.start_at, appConfig.restaurantTimeZone)}</strong>
            <span>to {formatRestaurantTime(reservation.end_at, appConfig.restaurantTimeZone)}</span>
          </div>
          <div className="reservation-row__guest">
            <strong>{reservation.customer_name}</strong>
            <span><Users size={14} /> {reservation.party_size} guests</span>
          </div>
          <div className="reservation-row__table">
            <strong>{reservation.restaurant_tables?.code ?? "—"}</strong>
            <span>{reservation.restaurant_tables?.name ?? "Unknown table"}</span>
          </div>
          <div className="reservation-row__contact">
            <span><Phone size={14} /> {reservation.customer_phone}</span>
            {reservation.customer_email ? <span><Mail size={14} /> {reservation.customer_email}</span> : null}
          </div>
          <div className="reservation-row__status">
            <Badge tone={reservationStatusTones[reservation.status]}>
              {reservationStatusLabels[reservation.status]}
            </Badge>
            {onStatusChange && getNextReservationStatuses(reservation.status).length > 0 ? (
              <div className="reservation-row__actions">
                {getNextReservationStatuses(reservation.status).map((status) => (
                  <Button
                    key={status}
                    type="button"
                    size="small"
                    variant={status === "cancelled" || status === "no_show" ? "ghost" : "secondary"}
                    disabled={updatingId === reservation.id}
                    onClick={() => onStatusChange(reservation, status)}
                  >
                    {reservationStatusLabels[status]}
                  </Button>
                ))}
              </div>
            ) : null}
          </div>
        </article>
      ))}
    </div>
  );
}
