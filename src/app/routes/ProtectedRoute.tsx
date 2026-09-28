import { Navigate, Outlet, useLocation } from "react-router";

import { ErrorNotice, LoadingState } from "../../components/ui/States";
import { useAuth } from "../providers/AuthProvider";

export function ProtectedRoute() {
  const { session, isStaff, isLoading, error } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <main className="auth-loading">
        <LoadingState label="Checking management access" />
      </main>
    );
  }

  if (!session) {
    return <Navigate to="/manage/login" replace state={{ from: location }} />;
  }

  if (!isStaff) {
    return (
      <main className="auth-loading">
        <ErrorNotice message={error ?? "This account does not have management access."} />
      </main>
    );
  }

  return <Outlet />;
}
