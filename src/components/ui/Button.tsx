import type { ButtonHTMLAttributes, PropsWithChildren } from "react";

type ButtonProps = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "primary" | "secondary" | "ghost" | "danger";
    size?: "small" | "medium" | "large";
    isLoading?: boolean;
  }
>;

export function Button({
  children,
  className = "",
  variant = "primary",
  size = "medium",
  isLoading = false,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`button button--${variant} button--${size} ${className}`.trim()}
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      {...props}
    >
      {isLoading ? <span className="button__spinner" aria-hidden="true" /> : null}
      {children}
    </button>
  );
}
