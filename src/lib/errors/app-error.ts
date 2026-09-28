export type BackendErrorCode =
  | "INVALID_INPUT"
  | "INVALID_TIME_RANGE"
  | "OUTSIDE_OPENING_HOURS"
  | "CAPACITY_EXCEEDED"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "TABLE_NOT_FOUND"
  | "TABLE_NOT_AVAILABLE"
  | "RESERVATIONS_DISABLED"
  | "CONFIGURATION_ERROR"
  | "INTERNAL_ERROR";

const friendlyMessages: Record<BackendErrorCode, string> = {
  INVALID_INPUT: "Check the details you entered and try again.",
  INVALID_TIME_RANGE: "Choose an end time that is later than the start time.",
  OUTSIDE_OPENING_HOURS: "That time falls outside the restaurant's opening hours.",
  CAPACITY_EXCEEDED: "This table is too small for your party.",
  UNAUTHORIZED: "Sign in to continue.",
  FORBIDDEN: "This account does not have management access.",
  TABLE_NOT_FOUND: "That table is no longer available.",
  TABLE_NOT_AVAILABLE: "Someone just reserved this table. Choose another one.",
  RESERVATIONS_DISABLED: "Reservations are temporarily unavailable.",
  CONFIGURATION_ERROR: "Reservin is not connected to Supabase yet.",
  INTERNAL_ERROR: "Something went wrong. Please try again.",
};

export class AppError extends Error {
  constructor(
    public readonly code: BackendErrorCode,
    message = friendlyMessages[code],
  ) {
    super(message);
    this.name = "AppError";
  }
}

const knownCodes = new Set<BackendErrorCode>(
  Object.keys(friendlyMessages) as BackendErrorCode[],
);

export function toAppError(error: unknown): AppError {
  if (error instanceof AppError) return error;

  if (typeof error === "object" && error !== null) {
    const candidate = error as {
      code?: unknown;
      message?: unknown;
      error?: { code?: unknown; message?: unknown };
    };
    const code = candidate.error?.code ?? candidate.code;
    const message = candidate.error?.message ?? candidate.message;

    if (typeof code === "string" && knownCodes.has(code as BackendErrorCode)) {
      return new AppError(
        code as BackendErrorCode,
        typeof message === "string" && message.length > 0
          ? friendlyMessages[code as BackendErrorCode]
          : undefined,
      );
    }

    if (typeof message === "string") {
      const embeddedCode = [...knownCodes].find((knownCode) =>
        message.includes(knownCode),
      );
      if (embeddedCode) return new AppError(embeddedCode);
    }
  }

  return new AppError("INTERNAL_ERROR");
}
