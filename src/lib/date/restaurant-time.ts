import { fromZonedTime } from "date-fns-tz";

export function getTomorrowDate() {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

export function getTodayDate(timeZone: string) {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone,
  }).format(new Date());
}

export function getRestaurantDayRange(date: string, timeZone: string) {
  const [year, month, day] = date.split("-").map(Number);
  const next = new Date(Date.UTC(year, month - 1, day + 1));
  const nextDate = next.toISOString().slice(0, 10);
  return {
    startAt: fromZonedTime(`${date}T00:00:00`, timeZone).toISOString(),
    endAt: fromZonedTime(`${nextDate}T00:00:00`, timeZone).toISOString(),
  };
}

export function formatRestaurantTime(value: string, timeZone: string) {
  return new Intl.DateTimeFormat("en", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone,
  }).format(new Date(value));
}
