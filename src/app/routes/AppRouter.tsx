import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router";

import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { PublicLayout } from "../../components/layout/PublicLayout";
import { PublicReservationPage } from "../../features/reservation/PublicReservationPage";
import { LoadingState } from "../../components/ui/States";
import { ProtectedRoute } from "./ProtectedRoute";

const LoginPage = lazy(() => import("../../features/management-auth/LoginPage").then((module) => ({ default: module.LoginPage })));
const OverviewPage = lazy(() => import("../../features/reservation-management/OverviewPage").then((module) => ({ default: module.OverviewPage })));
const ReservationsPage = lazy(() => import("../../features/reservation-management/ReservationsPage").then((module) => ({ default: module.ReservationsPage })));
const TablesPage = lazy(() => import("../../features/table-management/TablesPage").then((module) => ({ default: module.TablesPage })));
const SettingsPage = lazy(() => import("../../features/restaurant-settings/SettingsPage").then((module) => ({ default: module.SettingsPage })));

function RouteLoading() {
  return <main className="auth-loading"><LoadingState label="Loading page" /></main>;
}

function NotFoundPage() {
  return (
    <main className="public-main public-main--centered">
      <section className="empty-state">
        <span className="eyebrow">404</span>
        <h1>That page isn’t on the menu.</h1>
        <a className="button button--primary button--medium" href="/">Back to reservations</a>
      </section>
    </main>
  );
}

export function AppRouter() {
  return (
    <Routes>
      <Route path="manage/login" element={<Suspense fallback={<RouteLoading />}><LoginPage /></Suspense>} />
      <Route element={<ProtectedRoute />}>
        <Route path="manage" element={<DashboardLayout />}>
          <Route index element={<Suspense fallback={<RouteLoading />}><OverviewPage /></Suspense>} />
          <Route path="reservations" element={<Suspense fallback={<RouteLoading />}><ReservationsPage /></Suspense>} />
          <Route path="tables" element={<Suspense fallback={<RouteLoading />}><TablesPage /></Suspense>} />
          <Route path="settings" element={<Suspense fallback={<RouteLoading />}><SettingsPage /></Suspense>} />
        </Route>
      </Route>
      <Route element={<PublicLayout />}>
        <Route index element={<PublicReservationPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
