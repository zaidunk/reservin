import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Filter } from "lucide-react";
import { useState } from "react";

import { appConfig } from "../../app/config/env";
import { Button } from "../../components/ui/Button";
import { Dialog } from "../../components/ui/Dialog";
import { InputField, SelectField } from "../../components/ui/Field";
import { ErrorNotice, LoadingState } from "../../components/ui/States";
import { listReservations, listTables, updateReservationStatus } from "../../lib/api/management";
import { getRestaurantDayRange, getTodayDate } from "../../lib/date/restaurant-time";
import { toAppError } from "../../lib/errors/app-error";
import type { ReservationStatus, ReservationWithTable } from "../../types/domain";
import { ReservationList } from "./components/ReservationList";
import { reservationStatusLabels } from "./reservation-status";

type PendingChange = { reservation: ReservationWithTable; status: ReservationStatus };

export function ReservationsPage() {
  const queryClient = useQueryClient();
  const [date, setDate] = useState(getTodayDate(appConfig.restaurantTimeZone));
  const [tableId, setTableId] = useState("");
  const [status, setStatus] = useState<ReservationStatus | "">("");
  const [pendingChange, setPendingChange] = useState<PendingChange>();
  const range = getRestaurantDayRange(date, appConfig.restaurantTimeZone);

  const tables = useQuery({ queryKey: ["tables"], queryFn: listTables });
  const reservations = useQuery({
    queryKey: ["reservations", date, tableId, status],
    queryFn: () => listReservations({ ...range, tableId: tableId || undefined, status: status || undefined }),
  });
  const updateStatus = useMutation({
    mutationFn: ({ reservation, status: nextStatus }: PendingChange) =>
      updateReservationStatus(reservation.id, nextStatus),
    onSuccess: async () => {
      setPendingChange(undefined);
      await queryClient.invalidateQueries({ queryKey: ["reservations"] });
    },
  });

  return (
    <main className="dashboard-page">
      <header className="dashboard-page__header">
        <div><h1>Reservations</h1><p>Monitor arrivals and keep each booking moving through service.</p></div>
      </header>

      <section className="filter-bar" aria-label="Reservation filters">
        <Filter size={18} aria-hidden="true" />
        <InputField id="reservation-filter-date" label="Date" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
        <SelectField id="reservation-filter-table" label="Table" value={tableId} onChange={(event) => setTableId(event.target.value)}>
          <option value="">All tables</option>
          {tables.data?.map((table) => <option key={table.id} value={table.id}>{table.code} · {table.name}</option>)}
        </SelectField>
        <SelectField id="reservation-filter-status" label="Status" value={status} onChange={(event) => setStatus(event.target.value as ReservationStatus | "")}>
          <option value="">All statuses</option>
          {(Object.entries(reservationStatusLabels) as Array<[ReservationStatus, string]>).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </SelectField>
        <Button type="button" variant="ghost" onClick={() => { setTableId(""); setStatus(""); }}>Reset</Button>
      </section>

      {reservations.error || updateStatus.error ? <ErrorNotice message={toAppError(reservations.error ?? updateStatus.error).message} /> : null}
      <section className="dashboard-panel">
        <div className="panel-heading"><div><h2>{reservations.data?.length ?? 0} reservations</h2><p>Times are shown in the restaurant timezone.</p></div></div>
        {reservations.isLoading ? (
          <LoadingState label="Loading reservations" />
        ) : (
          <ReservationList
            reservations={reservations.data ?? []}
            updatingId={updateStatus.isPending ? pendingChange?.reservation.id : undefined}
            onStatusChange={(reservation, nextStatus) => setPendingChange({ reservation, status: nextStatus })}
          />
        )}
      </section>

      <Dialog
        open={Boolean(pendingChange)}
        title="Update reservation?"
        description={pendingChange ? `${pendingChange.reservation.customer_name} will be marked ${reservationStatusLabels[pendingChange.status].toLowerCase()}.` : undefined}
        onClose={() => !updateStatus.isPending && setPendingChange(undefined)}
      >
        <div className="dialog-actions">
          <Button variant="secondary" onClick={() => setPendingChange(undefined)} disabled={updateStatus.isPending}>Keep current status</Button>
          <Button
            variant={pendingChange?.status === "cancelled" || pendingChange?.status === "no_show" ? "danger" : "primary"}
            isLoading={updateStatus.isPending}
            onClick={() => pendingChange && updateStatus.mutate(pendingChange)}
          >
            Update status
          </Button>
        </div>
      </Dialog>
    </main>
  );
}
