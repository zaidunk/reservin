import { Route, Routes } from "react-router";

import { PublicLayout } from "../../components/layout/PublicLayout";
import { PublicReservationPage } from "../../features/reservation/PublicReservationPage";

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
      <Route element={<PublicLayout />}>
        <Route index element={<PublicReservationPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
