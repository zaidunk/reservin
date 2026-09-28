import { Link, Outlet } from "react-router";

export function PublicLayout() {
  return (
    <div className="site-shell">
      <header className="public-header">
        <Link className="wordmark" to="/" aria-label="Reservin home">
          Reservin<span>.</span>
        </Link>
        <nav aria-label="Public navigation">
          <a href="#reserve">Reservations</a>
          <Link className="header-action" to="/manage/login">Management</Link>
        </nav>
      </header>
      <Outlet />
      <footer className="public-footer">
        <span className="wordmark wordmark--small">Reservin<span>.</span></span>
        <p>Find a table. Reserve it. Show up.</p>
      </footer>
    </div>
  );
}
