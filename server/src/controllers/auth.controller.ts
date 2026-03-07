import { Request, Response, NextFunction } from "express";
import Joi from "joi";
import { StatusCodes } from "http-status-codes";
import { verifyOAuthToken, findOrCreateUserAndSign, AuthProvider } from "../services/auth.service";
import { validateBody } from "../middlewares/validateBody";

const authBodySchema = Joi.object({
  idToken: Joi.string().required(),
  provider: Joi.string().valid("google", "apple").required(),
});

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { idToken, provider } = req.body as { idToken: string; provider: AuthProvider };
    const decoded = await verifyOAuthToken(idToken);
    if (!decoded) {
      res.status(StatusCodes.UNAUTHORIZED).json({ error: "Invalid or expired ID token" });
      return;
    }
    const result = await findOrCreateUserAndSign(
      provider,
      decoded.uid,
      decoded.email ?? "",
      decoded.name ?? "User",
      decoded.picture
    );
    res.status(StatusCodes.OK).json(result);
  } catch (err) {
    next(err);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authReq = req as import("../middlewares/requireAuth").AuthenticatedRequest;
    if (!authReq.userId) {
      res.status(StatusCodes.UNAUTHORIZED).json({ error: "Not authenticated" });
      return;
    }
    res.status(StatusCodes.OK).json({ message: "Use existing token; refresh not yet implemented" });
  } catch (err) {
    next(err);
  }
}

export const authValidation = validateBody(authBodySchema);
