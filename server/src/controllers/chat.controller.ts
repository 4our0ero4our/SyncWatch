import { Request, Response, NextFunction } from "express";
import Joi from "joi";
import { StatusCodes } from "http-status-codes";
import { AuthenticatedRequest } from "../middlewares/requireAuth";
import { saveMessage, getMessages } from "../services/chat.service";
import { validateBody } from "../middlewares/validateBody";

const sendMessageSchema = Joi.object({
  type: Joi.string().valid("text", "reaction").required(),
  content: Joi.string().max(2000).required(),
});

export async function sendMessage(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const roomId = req.params.roomId!;
    const userId = req.userId!;
    const { type, content } = req.body as { type: "text" | "reaction"; content: string };
    const message = await saveMessage(roomId, userId, type, content);
    res.status(StatusCodes.CREATED).json(message);
  } catch (err: unknown) {
    const appErr = err as { statusCode?: number };
    if (appErr.statusCode === 403) {
      res.status(StatusCodes.FORBIDDEN).json({ error: "You are not a participant of this room" });
      return;
    }
    next(err);
  }
}

export async function listMessages(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const roomId = req.params.roomId!;
    const limit = Math.min(parseInt(req.query.limit as string, 10) || 50, 100);
    const before = req.query.before as string | undefined;
    const messages = await getMessages(roomId, limit, before);
    res.status(StatusCodes.OK).json({ messages });
  } catch (err) {
    next(err);
  }
}

export const sendMessageValidation = validateBody(sendMessageSchema);
