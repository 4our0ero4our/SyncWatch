import { Response, NextFunction } from "express";
import Joi from "joi";
import { StatusCodes } from "http-status-codes";
import { AuthenticatedRequest } from "../middlewares/requireAuth";
import { getPlaybackState, setPlaybackState } from "../services/sync.service";
import { validateBody } from "../middlewares/validateBody";

const syncBodySchema = Joi.object({
  state: Joi.string().valid("playing", "paused").required(),
  timestamp: Joi.number().min(0).required(),
});

export async function getSync(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const roomId = req.params.roomId!;
    const state = await getPlaybackState(roomId);
    res.status(StatusCodes.OK).json(state ?? { state: "paused", timestamp: 0, updatedAt: 0, hostId: "" });
  } catch (err) {
    next(err);
  }
}

export async function updateSync(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const roomId = req.params.roomId!;
    const hostId = req.userId!;
    const { state, timestamp } = req.body as { state: "playing" | "paused"; timestamp: number };
    const ok = await setPlaybackState(roomId, hostId, state, timestamp);
    if (!ok) {
      res.status(StatusCodes.FORBIDDEN).json({ error: "Only the host can update playback state" });
      return;
    }
    res.status(StatusCodes.OK).json({ state, timestamp, updatedAt: Date.now() / 1000 });
  } catch (err) {
    next(err);
  }
}

export const syncBodyValidation = validateBody(syncBodySchema);
