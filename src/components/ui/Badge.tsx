import type { PropsWithChildren } from "react";

export type BadgeTone = "default" | "success" | "warning" | "error" | "info" | "olive";

export function Badge({
  children,
  tone = "default",
}: PropsWithChildren<{ tone?: BadgeTone }>) {
  return <span className={`badge badge--${tone}`}>{children}</span>;
}
