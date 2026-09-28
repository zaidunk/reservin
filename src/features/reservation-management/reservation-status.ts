import type { BadgeTone } from "../../components/ui/Badge";
import type { ReservationStatus } from "../../types/domain";

const nextStatuses: Record<ReservationStatus, ReservationStatus[]> = {
  confirmed: ["seated", "cancelled", "no_show"],
  seated: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
  no_show: [],
};

export const reservationStatusLabels: Record<ReservationStatus, string> = {
  confirmed: "Confirmed",
  seated: "Seated",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No show",
};

export const reservationStatusTones: Record<ReservationStatus, BadgeTone> = {
  confirmed: "success",
  seated: "olive",
  completed: "default",
  cancelled: "error",
  no_show: "warning",
};

export function getNextReservationStatuses(status: ReservationStatus) {
  return nextStatuses[status];
}
