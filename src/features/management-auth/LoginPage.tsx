import { LockKeyhole } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router";

import { Button } from "../../components/ui/Button";
import { InputField } from "../../components/ui/Field";
import { ErrorNotice } from "../../components/ui/States";
import { signIn, signOut } from "../../lib/api/auth";
import { toAppError } from "../../lib/errors/app-error";
import { loginSchema } from "../../lib/validation/management";
import { useAuth } from "../../app/providers/AuthProvider";

export function LoginPage() {
  const { session, isStaff, isLoading: authLoading, refresh, error: authError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [value, setValue] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!authLoading && session && isStaff) return <Navigate to="/manage" replace />;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = loginSchema.safeParse(value);
    if (!result.success) {
      setErrors(Object.fromEntries(result.error.issues.map((issue) => [String(issue.path[0]), issue.message])));
      return;
    }

    setErrors({});
    setSubmitError(undefined);
    setIsSubmitting(true);
    try {
      await signIn(result.data.email, result.data.password);
      await refresh();
      const destination = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;
      navigate(destination || "/manage", { replace: true });
    } catch (error) {
      await signOut().catch(() => undefined);
      setSubmitError(toAppError(error).message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-page__aside">
        <Link className="wordmark wordmark--light" to="/">Reservin<span>.</span></Link>
        <div>
          <h1>A calmer view of every service.</h1>
          <p>See what’s booked, keep tables current, and move each reservation through service.</p>
        </div>
        <p className="login-page__aside-note">Find a table. Reserve it. Show up.</p>
      </section>
      <section className="login-page__form-wrap">
        <form className="login-card" onSubmit={handleSubmit} noValidate>
          <div className="login-card__icon"><LockKeyhole size={22} aria-hidden="true" /></div>
          <h2>Welcome back.</h2>
          <p>Sign in with your restaurant management account.</p>
          {submitError || authError ? <ErrorNotice message={submitError ?? authError!} /> : null}
          <div className="login-card__fields">
            <InputField
              id="staff-email"
              label="Email"
              type="email"
              autoComplete="email"
              value={value.email}
              error={errors.email}
              onChange={(event) => setValue({ ...value, email: event.target.value })}
            />
            <InputField
              id="staff-password"
              label="Password"
              type="password"
              autoComplete="current-password"
              value={value.password}
              error={errors.password}
              onChange={(event) => setValue({ ...value, password: event.target.value })}
            />
          </div>
          <Button type="submit" size="large" isLoading={isSubmitting}>Sign in</Button>
          <Link className="login-card__back" to="/">← Back to reservations</Link>
        </form>
      </section>
    </main>
  );
}
