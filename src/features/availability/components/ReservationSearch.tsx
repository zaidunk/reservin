import { CalendarDays, Clock3, Users } from "lucide-react";
import { useState, type FormEvent } from "react";

import { Button } from "../../../components/ui/Button";
import { InputField, SelectField } from "../../../components/ui/Field";
import {
  reservationSearchSchema,
  type ReservationSearchInput,
} from "../../../lib/validation/reservation";

type ReservationSearchProps = {
  initialValue: ReservationSearchInput;
  isLoading?: boolean;
  onSearch: (value: ReservationSearchInput) => void;
};

export function ReservationSearch({
  initialValue,
  isLoading = false,
  onSearch,
}: ReservationSearchProps) {
  const [value, setValue] = useState(initialValue);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = reservationSearchSchema.safeParse(value);
    if (!result.success) {
      setErrors(
        Object.fromEntries(
          result.error.issues.map((issue) => [String(issue.path[0]), issue.message]),
        ),
      );
      return;
    }
    setErrors({});
    onSearch(result.data);
  }

  return (
    <form className="reservation-search" onSubmit={handleSubmit} noValidate>
      <div className="reservation-search__field">
        <CalendarDays size={18} aria-hidden="true" />
        <InputField
          id="reservation-date"
          label="Date"
          type="date"
          min={new Date().toISOString().slice(0, 10)}
          value={value.date}
          error={errors.date}
          onChange={(event) => setValue({ ...value, date: event.target.value })}
        />
      </div>
      <div className="reservation-search__field">
        <Clock3 size={18} aria-hidden="true" />
        <InputField
          id="reservation-start"
          label="Start time"
          type="time"
          step="900"
          value={value.startTime}
          error={errors.startTime}
          onChange={(event) => setValue({ ...value, startTime: event.target.value })}
        />
      </div>
      <div className="reservation-search__field">
        <Clock3 size={18} aria-hidden="true" />
        <InputField
          id="reservation-end"
          label="End time"
          type="time"
          step="900"
          value={value.endTime}
          error={errors.endTime}
          onChange={(event) => setValue({ ...value, endTime: event.target.value })}
        />
      </div>
      <div className="reservation-search__field">
        <Users size={18} aria-hidden="true" />
        <SelectField
          id="reservation-party"
          label="Party size"
          value={value.partySize}
          error={errors.partySize}
          onChange={(event) =>
            setValue({ ...value, partySize: Number(event.target.value) })
          }
        >
          {Array.from({ length: 12 }, (_, index) => index + 1).map((count) => (
            <option key={count} value={count}>
              {count} {count === 1 ? "guest" : "guests"}
            </option>
          ))}
        </SelectField>
      </div>
      <Button type="submit" size="large" isLoading={isLoading}>
        Find a table
      </Button>
    </form>
  );
}
