import { Response, NextFunction } from "express";
import Joi from "joi";
import { StatusCodes } from "http-status-codes";
import { AuthenticatedRequest } from "../middlewares/requireAuth";
import { getUserProfile, updateUserProfile } from "../services/user.service";
import { validateBody } from "../middlewares/validateBody";

const updateUserSchema = Joi.object({
  streamingProvider: Joi.string().valid("netflix", "prime", "youtube"),
  displayName: Joi.string().trim().min(1).max(100),
}).min(1);

export async function getMe(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.userId!;
    const profile = await getUserProfile(userId);
    if (!profile) {
      res.status(StatusCodes.NOT_FOUND).json({ error: "User not found" });
      return;
    }
    console.log("[user.controller] getMe", { userId, streamingProvider: profile.streamingProvider });
    res.status(StatusCodes.OK).json(profile);
  } catch (err) {
    next(err);
  }
}

export async function updateMe(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.userId!;
    const { streamingProvider, displayName } = req.body as { streamingProvider?: string; displayName?: string };
    const profile = await updateUserProfile(userId, {
      streamingProvider: streamingProvider as "netflix" | "prime" | "youtube" | undefined,
      displayName,
    });
    if (!profile) {
      res.status(StatusCodes.NOT_FOUND).json({ error: "User not found" });
      return;
    }
    console.log("[user.controller] updateMe: success", {
      userId,
      streamingProvider: profile.streamingProvider,
      displayName: profile.displayName,
    });
    res.status(StatusCodes.OK).json(profile);
  } catch (err) {
    next(err);
  }
}

export const updateMeValidation = validateBody(updateUserSchema);
