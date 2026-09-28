import { useQuery } from "@tanstack/react-query";
import { CalendarCheck2, CircleCheckBig, Clock3, Table2 } from "lucide-react";
import { Link } from "react-router";

import { appConfig } from "../../app/config/env";
import { Badge } from "../../components/ui/Badge";
import { ErrorNotice, LoadingState } from "../../components/ui/States";
import { listReservations, listTables } from "../../lib/api/management";
import { getRestaurantDayRange, getTodayDate } from "../../lib/date/restaurant-time";
import { toAppError } from "../../lib/errors/app-error";
import { ReservationList } from "./components/ReservationList";

export function OverviewPage() {
  const today = getTodayDate(appConfig.restaurantTimeZone);
  const range = getRestaurantDayRange(today, appConfig.restaurantTimeZone);
  const reservations = useQuery({
    queryKey: ["reservations", "today", today],
    queryFn: () => listReservations(range),
  });
  const tables = useQuery({ queryKey: ["tables"], queryFn: listTables });

  const activeReservations = reservations.data?.filter((item) => item.status === "confirmed" || item.status === "seated") ?? [];
  const completed = reservations.data?.filter((item) => item.status === "completed").length ?? 0;
  const activeTables = tables.data?.filter((table) => table.is_active).length ?? 0;

  return (
    <main className="dashboard-page">
      <header className="dashboard-page__header">
        <div><span className="eyebrow">Service overview</span><h1>Good day.</h1><p>Here’s what the restaurant needs today.</p></div>
        <Badge tone="olive">{new Intl.DateTimeFormat("en", { dateStyle: "full", timeZone: appConfig.restaurantTimeZone }).format(new Date())}</Badge>
      </header>
      {reservations.error || tables.error ? <ErrorNotice message={toAppError(reservations.error ?? tables.error).message} /> : null}
      <section className="stat-grid" aria-label="Today's summary">
        <article className="stat-card"><CalendarCheck2 size={20} /><span>Reservations</span><strong>{reservations.data?.length ?? "—"}</strong><small>scheduled today</small></article>
        <article className="stat-card"><Clock3 size={20} /><span>In service</span><strong>{activeReservations.length}</strong><small>confirmed or seated</small></article>
        <article className="stat-card"><CircleCheckBig size={20} /><span>Completed</span><strong>{completed}</strong><small>finished today</small></article>
        <article className="stat-card"><Table2 size={20} /><span>Active tables</span><strong>{activeTables || "—"}</strong><small>accepting reservations</small></article>
      </section>
      <section className="dashboard-panel">
        <div className="panel-heading"><div><h2>Today’s reservations</h2><p>Ordered by arrival time.</p></div><Link to="/manage/reservations">View schedule →</Link></div>
        {reservations.isLoading ? <LoadingState label="Loading today's reservations" /> : <ReservationList reservations={reservations.data?.slice(0, 6) ?? []} />}
      </section>
    </main>
  );
}
