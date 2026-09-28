import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Clock3, Power } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

import { Button } from "../../components/ui/Button";
import { InputField } from "../../components/ui/Field";
import { ErrorNotice, LoadingState } from "../../components/ui/States";
import { getRestaurantConfiguration, updateRestaurantConfiguration } from "../../lib/api/management";
import { toAppError } from "../../lib/errors/app-error";
import { openingHoursSchema, restaurantSettingsSchema } from "../../lib/validation/management";

const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
type HoursValue = { dayOfWeek: number; openTime: string | null; closeTime: string | null; isClosed: boolean };

const defaultHours: HoursValue[] = days.map((_, dayOfWeek) => ({
  dayOfWeek,
  openTime: "10:00",
  closeTime: "22:00",
  isClosed: false,
}));

export function SettingsPage() {
  const queryClient = useQueryClient();
  const configuration = useQuery({ queryKey: ["restaurant-configuration"], queryFn: getRestaurantConfiguration });
  const [settings, setSettings] = useState({ name: "", timezone: "Asia/Jakarta", reservationEnabled: true });
  const [hours, setHours] = useState<HoursValue[]>(defaultHours);
  const [validationError, setValidationError] = useState<string>();

  useEffect(() => {
    if (!configuration.data) return;
    setSettings({
      name: configuration.data.settings.name,
      timezone: configuration.data.settings.timezone,
      reservationEnabled: configuration.data.settings.reservation_enabled,
    });
    setHours(
      days.map((_, dayOfWeek) => {
        const existing = configuration.data!.openingHours.find((item) => item.day_of_week === dayOfWeek);
        return existing
          ? {
              dayOfWeek,
              openTime: existing.open_time?.slice(0, 5) ?? null,
              closeTime: existing.close_time?.slice(0, 5) ?? null,
              isClosed: existing.is_closed,
            }
          : defaultHours[dayOfWeek];
      }),
    );
  }, [configuration.data]);

  const save = useMutation({
    mutationFn: updateRestaurantConfiguration,
    onSuccess: async () => {
      setValidationError(undefined);
      await queryClient.invalidateQueries({ queryKey: ["restaurant-configuration"] });
    },
  });

  function updateDay(dayOfWeek: number, update: Partial<HoursValue>) {
    setHours((current) => current.map((day) => (day.dayOfWeek === dayOfWeek ? { ...day, ...update } : day)));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsedSettings = restaurantSettingsSchema.safeParse(settings);
    const parsedHours = openingHoursSchema.array().safeParse(hours);

    if (!parsedSettings.success || !parsedHours.success) {
      setValidationError(
        parsedSettings.error?.issues[0]?.message ??
          parsedHours.error?.issues[0]?.message ??
          "Check the restaurant settings.",
      );
      return;
    }

    setValidationError(undefined);
    save.mutate({
      settings: {
        name: parsedSettings.data.name,
        timezone: parsedSettings.data.timezone,
        reservation_enabled: parsedSettings.data.reservationEnabled,
      },
      openingHours: parsedHours.data.map((day) => {
        return {
          day_of_week: day.dayOfWeek,
          open_time: day.isClosed ? null : day.openTime,
          close_time: day.isClosed ? null : day.closeTime,
          is_closed: day.isClosed,
        };
      }),
    });
  }

  if (configuration.isLoading) {
    return <main className="dashboard-page"><LoadingState label="Loading restaurant settings" /></main>;
  }

  return (
    <main className="dashboard-page">
      <header className="dashboard-page__header">
        <div><span className="eyebrow">Configuration</span><h1>Restaurant settings</h1><p>Update the profile and the hours used for new reservations.</p></div>
      </header>
      {configuration.error || save.error || validationError ? <ErrorNotice message={validationError ?? toAppError(configuration.error ?? save.error).message} /> : null}
      {save.isSuccess ? <div className="notice notice--success" role="status">Settings saved.</div> : null}

      <form className="settings-form" onSubmit={handleSubmit} noValidate>
        <section className="dashboard-panel settings-section">
          <div className="panel-heading"><div><h2>Restaurant profile</h2><p>Shown to staff and used to interpret reservation times.</p></div></div>
          <div className="settings-profile-grid">
            <InputField id="restaurant-name" label="Restaurant name" value={settings.name} onChange={(event) => setSettings({ ...settings, name: event.target.value })} />
            <InputField id="restaurant-timezone" label="IANA timezone" value={settings.timezone} hint="Example: Asia/Jakarta" onChange={(event) => setSettings({ ...settings, timezone: event.target.value })} />
          </div>
          <label className="setting-toggle">
            <span className="setting-toggle__icon"><Power size={17} /></span>
            <span><strong>Accept new reservations</strong><small>Turn this off to pause public availability and booking.</small></span>
            <input type="checkbox" checked={settings.reservationEnabled} onChange={(event) => setSettings({ ...settings, reservationEnabled: event.target.checked })} />
            <span className="switch" aria-hidden="true" />
          </label>
        </section>

        <section className="dashboard-panel settings-section">
          <div className="panel-heading"><div><h2>Opening hours</h2><p>One reservation period per day for this proof of concept.</p></div><Clock3 size={20} /></div>
          <div className="hours-list">
            {hours.map((day) => (
              <div className={`hours-row ${day.isClosed ? "hours-row--closed" : ""}`} key={day.dayOfWeek}>
                <strong>{days[day.dayOfWeek]}</strong>
                <label className="compact-checkbox"><input type="checkbox" checked={day.isClosed} onChange={(event) => updateDay(day.dayOfWeek, { isClosed: event.target.checked, openTime: event.target.checked ? null : day.openTime ?? "10:00", closeTime: event.target.checked ? null : day.closeTime ?? "22:00" })} /> Closed</label>
                <label><span>Opens</span><input className="input" type="time" disabled={day.isClosed} value={day.openTime ?? ""} onChange={(event) => updateDay(day.dayOfWeek, { openTime: event.target.value })} /></label>
                <label><span>Closes</span><input className="input" type="time" disabled={day.isClosed} value={day.closeTime ?? ""} onChange={(event) => updateDay(day.dayOfWeek, { closeTime: event.target.value })} /></label>
              </div>
            ))}
          </div>
        </section>
        <div className="settings-actions"><Button type="submit" size="large" isLoading={save.isPending}>Save settings</Button></div>
      </form>
    </main>
  );
}
