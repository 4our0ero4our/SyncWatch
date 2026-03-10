import winston from "winston";
import { env } from "../config/env";

function serializeError(err: unknown): { name?: string; message: string; stack?: string; cause?: unknown } {
  if (err instanceof Error) {
    return {
      name: err.name,
      message: err.message,
      stack: err.stack,
      cause: (err as Error & { cause?: unknown }).cause,
    };
  }
  return { message: typeof err === "string" ? err : JSON.stringify(err) };
}

export const logger = winston.createLogger({
  level: env.NODE_ENV === "production" ? "info" : "debug",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format((info) => {
      // Winston's json formatter drops non-enumerable Error fields when nested.
      const maybeError = (info as unknown as { error?: unknown }).error;
      if (maybeError) {
        (info as unknown as { error?: unknown }).error = serializeError(maybeError);
      }
      return info;
    })(),
    winston.format.json()
  ),
  defaultMeta: { service: "watch-room-backend" },
  transports: [new winston.transports.Console()],
});
