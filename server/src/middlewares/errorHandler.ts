import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import { logger } from "../utils/logger";

interface AppError extends Error {
  statusCode?: number;
}

export function errorHandler(err: AppError, _req: Request, res: Response, _next: NextFunction): void {
  const status = err.statusCode ?? StatusCodes.INTERNAL_SERVER_ERROR;
  logger.error("Request error", { message: err.message, stack: err.stack });
  res.status(status).json({
    error: status === StatusCodes.INTERNAL_SERVER_ERROR ? "Internal server error" : err.message,
  });
}
