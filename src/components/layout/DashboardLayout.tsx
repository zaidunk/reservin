import { CalendarRange, LayoutDashboard, LogOut, Settings, Table2 } from "lucide-react";
import { NavLink, Outlet } from "react-router";

import { signOut } from "../../lib/api/auth";
import { useAuth } from "../../app/providers/AuthProvider";

const navItems = [
  { to: "/manage", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/manage/reservations", label: "Reservations", icon: CalendarRange },
  { to: "/manage/tables", label: "Tables", icon: Table2 },
  { to: "/manage/settings", label: "Settings", icon: Settings },
];

export function DashboardLayout() {
  const { session } = useAuth();

  return (
    <div className="dashboard-shell">
      <aside className="dashboard-sidebar">
        <NavLink className="wordmark" to="/manage">Reservin<span>.</span></NavLink>
        <nav aria-label="Management navigation">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `dashboard-nav__link ${isActive ? "dashboard-nav__link--active" : ""}`}
            >
              <Icon size={18} aria-hidden="true" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="dashboard-sidebar__account">
          <div className="avatar" aria-hidden="true">
            {session?.user.email?.slice(0, 1).toUpperCase() ?? "S"}
          </div>
          <div>
            <strong>Staff account</strong>
            <span>{session?.user.email}</span>
          </div>
          <button type="button" className="icon-button" aria-label="Sign out" onClick={() => void signOut()}>
            <LogOut size={17} aria-hidden="true" />
          </button>
        </div>
      </aside>
      <div className="dashboard-content">
        <Outlet />
      </div>
    </div>
  );
}
