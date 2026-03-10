import { Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import { AuthenticatedRequest } from "../middlewares/requireAuth";
import { joinRoom, removeParticipant, listParticipants } from "../services/participant.service";

export async function join(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const roomId = req.params.roomId!;
    const userId = req.userId!;
    const result = await joinRoom(roomId, userId);
    if (!result) {
      res.status(StatusCodes.NOT_FOUND).json({ error: "Room not found" });
      return;
    }
    res.status(StatusCodes.OK).json(result);
  } catch (err) {
    next(err);
  }
}

export async function kick(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { roomId, userId: targetUserId } = req.params;
    const actorId = req.userId!;
    const removed = await removeParticipant(roomId!, targetUserId!, actorId);
    if (!removed) {
      res.status(StatusCodes.FORBIDDEN).json({ error: "Cannot remove this participant" });
      return;
    }
    res.status(StatusCodes.NO_CONTENT).send();
  } catch (err) {
    next(err);
  }
}

export async function list(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const roomId = req.params.roomId!;
    const participants = await listParticipants(roomId);
    res.status(StatusCodes.OK).json({ participants });
  } catch (err) {
    next(err);
  }
}
