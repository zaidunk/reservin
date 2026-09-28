import { useEffect, useState, type FormEvent } from "react";

import { Button } from "../../../components/ui/Button";
import { InputField } from "../../../components/ui/Field";
import { tableSchema } from "../../../lib/validation/management";
import type { RestaurantTable } from "../../../types/domain";

export type TableFormValue = {
  code: string;
  name: string;
  capacity: number;
  area: string | null;
};

const emptyValue = { code: "", name: "", capacity: 2, area: "" };

export function TableForm({
  table,
  isLoading,
  onCancel,
  onSubmit,
}: {
  table?: RestaurantTable;
  isLoading: boolean;
  onCancel: () => void;
  onSubmit: (value: TableFormValue) => void;
}) {
  const [value, setValue] = useState(emptyValue);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setValue(
      table
        ? { code: table.code, name: table.name, capacity: table.capacity, area: table.area ?? "" }
        : emptyValue,
    );
    setErrors({});
  }, [table]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = tableSchema.safeParse(value);
    if (!result.success) {
      setErrors(Object.fromEntries(result.error.issues.map((issue) => [String(issue.path[0]), issue.message])));
      return;
    }
    setErrors({});
    onSubmit(result.data);
  }

  return (
    <form className="table-form" onSubmit={handleSubmit} noValidate>
      <div className="table-form__grid">
        <InputField id="table-code" label="Table code" value={value.code} error={errors.code} placeholder="T04" onChange={(event) => setValue({ ...value, code: event.target.value.toUpperCase() })} />
        <InputField id="table-capacity" label="Capacity" type="number" min="1" max="100" value={value.capacity} error={errors.capacity} onChange={(event) => setValue({ ...value, capacity: Number(event.target.value) })} />
        <InputField id="table-name" label="Display name" value={value.name} error={errors.name} placeholder="Garden Table" onChange={(event) => setValue({ ...value, name: event.target.value })} />
        <InputField id="table-area" label="Area (optional)" value={value.area ?? ""} error={errors.area} placeholder="Outdoor" onChange={(event) => setValue({ ...value, area: event.target.value })} />
      </div>
      <div className="dialog-actions">
        <Button type="button" variant="secondary" disabled={isLoading} onClick={onCancel}>Cancel</Button>
        <Button type="submit" isLoading={isLoading}>{table ? "Save changes" : "Add table"}</Button>
      </div>
    </form>
  );
}
