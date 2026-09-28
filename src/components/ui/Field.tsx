import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

type FieldShellProps = {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
};

function FieldShell({ id, label, hint, error, children }: FieldShellProps) {
  const messageId = `${id}-message`;
  return (
    <div className="field">
      <label className="field__label" htmlFor={id}>
        {label}
      </label>
      {children}
      {error || hint ? (
        <p
          className={`field__message ${error ? "field__message--error" : ""}`}
          id={messageId}
        >
          {error ?? hint}
        </p>
      ) : null}
    </div>
  );
}

export function InputField({
  label,
  error,
  hint,
  className = "",
  id,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  hint?: string;
  id: string;
}) {
  return (
    <FieldShell id={id} label={label} error={error} hint={hint}>
      <input
        id={id}
        className={`input ${error ? "input--error" : ""} ${className}`.trim()}
        aria-invalid={Boolean(error)}
        aria-describedby={error || hint ? `${id}-message` : undefined}
        {...props}
      />
    </FieldShell>
  );
}

export function SelectField({
  label,
  error,
  hint,
  className = "",
  id,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  error?: string;
  hint?: string;
  id: string;
}) {
  return (
    <FieldShell id={id} label={label} error={error} hint={hint}>
      <select
        id={id}
        className={`input input--select ${error ? "input--error" : ""} ${className}`.trim()}
        aria-invalid={Boolean(error)}
        aria-describedby={error || hint ? `${id}-message` : undefined}
        {...props}
      >
        {children}
      </select>
    </FieldShell>
  );
}

export function TextareaField({
  label,
  error,
  hint,
  className = "",
  id,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  error?: string;
  hint?: string;
  id: string;
}) {
  return (
    <FieldShell id={id} label={label} error={error} hint={hint}>
      <textarea
        id={id}
        className={`input input--textarea ${error ? "input--error" : ""} ${className}`.trim()}
        aria-invalid={Boolean(error)}
        aria-describedby={error || hint ? `${id}-message` : undefined}
        {...props}
      />
    </FieldShell>
  );
}
