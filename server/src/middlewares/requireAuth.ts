import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt.util";
import { StatusCodes } from "http-status-codes";

export interface AuthenticatedRequest extends Request {
  userId?: string;
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) {
    res.status(StatusCodes.UNAUTHORIZED).json({ error: "Missing or invalid authorization" });
    return;
  }
  const payload = verifyToken(token);
  if (!payload) {
    res.status(StatusCodes.UNAUTHORIZED).json({ error: "Invalid or expired token" });
    return;
  }
  req.userId = payload.userId;
  next();
}
