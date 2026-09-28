import { useState, type FormEvent } from "react";

import { Button } from "../../../components/ui/Button";
import { InputField, TextareaField } from "../../../components/ui/Field";
import {
  reservationDetailsSchema,
  type ReservationDetailsInput,
} from "../../../lib/validation/reservation";

export function ReservationDetailsForm({
  isLoading,
  onBack,
  onSubmit,
}: {
  isLoading: boolean;
  onBack: () => void;
  onSubmit: (value: ReservationDetailsInput) => void;
}) {
  const [value, setValue] = useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    notes: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = reservationDetailsSchema.safeParse(value);
    if (!result.success) {
      setErrors(
        Object.fromEntries(
          result.error.issues.map((issue) => [String(issue.path[0]), issue.message]),
        ),
      );
      return;
    }
    setErrors({});
    onSubmit(result.data);
  }

  return (
    <form className="details-form" onSubmit={handleSubmit} noValidate>
      <div className="details-form__grid">
        <InputField
          id="customer-name"
          label="Reservation name"
          autoComplete="name"
          value={value.customerName}
          error={errors.customerName}
          onChange={(event) => setValue({ ...value, customerName: event.target.value })}
        />
        <InputField
          id="customer-phone"
          label="Phone number"
          type="tel"
          autoComplete="tel"
          value={value.customerPhone}
          error={errors.customerPhone}
          onChange={(event) => setValue({ ...value, customerPhone: event.target.value })}
        />
        <InputField
          id="customer-email"
          label="Email (optional)"
          type="email"
          autoComplete="email"
          value={value.customerEmail}
          error={errors.customerEmail}
          onChange={(event) => setValue({ ...value, customerEmail: event.target.value })}
        />
        <TextareaField
          id="reservation-notes"
          label="Notes (optional)"
          rows={3}
          value={value.notes}
          error={errors.notes}
          onChange={(event) => setValue({ ...value, notes: event.target.value })}
        />
      </div>
      <div className="form-actions">
        <Button type="button" variant="secondary" disabled={isLoading} onClick={onBack}>
          Change table
        </Button>
        <Button type="submit" size="large" isLoading={isLoading}>
          Reserve this table
        </Button>
      </div>
    </form>
  );
}
