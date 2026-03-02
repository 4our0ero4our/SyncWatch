import { Response, NextFunction } from "express";
import Joi from "joi";
import { StatusCodes } from "http-status-codes";
import { AuthenticatedRequest } from "../middlewares/requireAuth";
import { getUserProfile, updateStreamingProvider } from "../services/user.service";
import { validateBody } from "../middlewares/validateBody";

const updateStreamingProviderSchema = Joi.object({
  streamingProvider: Joi.string().valid("netflix", "prime").required(),
});

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
    const { streamingProvider } = req.body as { streamingProvider: string };
    const profile = await updateStreamingProvider(userId, streamingProvider as "netflix" | "prime");
    if (!profile) {
      res.status(StatusCodes.NOT_FOUND).json({ error: "User not found" });
      return;
    }
    console.log("[user.controller] updateMe: success", { userId, streamingProvider });
    res.status(StatusCodes.OK).json(profile);
  } catch (err) {
    next(err);
  }
}

export const updateMeValidation = validateBody(updateStreamingProviderSchema);
