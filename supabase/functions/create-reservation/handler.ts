import { z } from "zod";

const reservationInputSchema = z
  .object({
    table_id: z.string().uuid(),
    customer_name: z.string().trim().min(1),
    customer_phone: z.string().trim().min(1),
    customer_email: z.string().trim().email().nullable().optional(),
    party_size: z.number().int().positive(),
    start_at: z.string().datetime({ offset: true }),
    end_at: z.string().datetime({ offset: true }),
    notes: z.string().trim().nullable().optional(),
  })
  .strict();

export type ReservationInput = z.infer<typeof reservationInputSchema>;

export type ReservationResult = {
  reservation_id: string;
  confirmation_code: string;
  status: "confirmed";
  table_id: string;
  start_at: string;
  end_at: string;
};

type KnownErrorCode =
  | "INVALID_INPUT"
  | "INVALID_TIME_RANGE"
  | "OUTSIDE_OPENING_HOURS"
  | "CAPACITY_EXCEEDED"
  | "TABLE_NOT_FOUND"
  | "TABLE_NOT_AVAILABLE"
  | "RESERVATIONS_DISABLED";

type Logger = {
  info: (event: Record<string, unknown>) => void;
  error: (event: Record<string, unknown>) => void;
};

type HandlerDependencies = {
  createReservation: (input: ReservationInput) => Promise<ReservationResult>;
  logger: Logger;
  createRequestId?: () => string;
};

const statusByCode: Record<KnownErrorCode, number> = {
  INVALID_INPUT: 400,
  INVALID_TIME_RANGE: 400,
  OUTSIDE_OPENING_HOURS: 400,
  CAPACITY_EXCEEDED: 400,
  TABLE_NOT_FOUND: 404,
  TABLE_NOT_AVAILABLE: 409,
  RESERVATIONS_DISABLED: 503,
};

const knownCodes = new Set(Object.keys(statusByCode));

const json = (body: unknown, status: number) =>
  Response.json(body, {
    status,
    headers: { "cache-control": "no-store" },
  });

const errorResponse = (
  code: KnownErrorCode | "INTERNAL_ERROR",
  message: string,
  status: number,
  requestId: string,
) => json({ error: { code, message }, request_id: requestId }, status);

const asKnownError = (
  error: unknown,
): { code: KnownErrorCode; message: string } | null => {
  if (typeof error !== "object" || error === null) return null;

  const candidate = error as { code?: unknown; message?: unknown };
  if (
    typeof candidate.code !== "string" ||
    !knownCodes.has(candidate.code) ||
    typeof candidate.message !== "string"
  ) {
    return null;
  }

  return {
    code: candidate.code as KnownErrorCode,
    message: candidate.message,
  };
};

export const createReservationHandler = ({
  createReservation,
  logger,
  createRequestId = () => crypto.randomUUID(),
}: HandlerDependencies) => {
  return async (request: Request): Promise<Response> => {
    const requestId = request.headers.get("x-request-id") ?? createRequestId();

    if (request.method !== "POST") {
      logger.info({ request_id: requestId, event: "validation_failure", category: "method" });
      return errorResponse(
        "INVALID_INPUT",
        "Only POST requests are supported.",
        400,
        requestId,
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      logger.info({ request_id: requestId, event: "validation_failure", category: "json" });
      return errorResponse(
        "INVALID_INPUT",
        "The request body must be valid JSON.",
        400,
        requestId,
      );
    }

    const parsed = reservationInputSchema.safeParse(body);
    if (!parsed.success) {
      logger.info({ request_id: requestId, event: "validation_failure", category: "input" });
      return errorResponse(
        "INVALID_INPUT",
        "The reservation request is malformed or incomplete.",
        400,
        requestId,
      );
    }

    if (Date.parse(parsed.data.start_at) >= Date.parse(parsed.data.end_at)) {
      logger.info({ request_id: requestId, event: "validation_failure", category: "time_range" });
      return errorResponse(
        "INVALID_TIME_RANGE",
        "start_at must be earlier than end_at.",
        400,
        requestId,
      );
    }

    logger.info({ request_id: requestId, event: "reservation_creation_attempt" });

    try {
      const result = await createReservation(parsed.data);
      logger.info({
        request_id: requestId,
        event: "reservation_created",
        reservation_id: result.reservation_id,
      });
      return json(result, 201);
    } catch (error) {
      const knownError = asKnownError(error);
      if (knownError) {
        logger.info({
          request_id: requestId,
          event:
            knownError.code === "TABLE_NOT_AVAILABLE"
              ? "reservation_conflict"
              : "validation_failure",
          category: knownError.code,
        });
        return errorResponse(
          knownError.code,
          knownError.message,
          statusByCode[knownError.code],
          requestId,
        );
      }

      logger.error({ request_id: requestId, event: "unexpected_server_error" });
      return errorResponse(
        "INTERNAL_ERROR",
        "An unexpected server error occurred.",
        500,
        requestId,
      );
    }
  };
};
