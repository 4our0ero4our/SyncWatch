import { Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import { AuthenticatedRequest } from "../middlewares/requireAuth";
import { joinWaitingRoom, leaveWaitingRoom, listWaitingUsers } from "../services/waiting.service";

export async function join(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const roomId = req.params.roomId!;
    const userId = req.userId!;
    const waiting = await joinWaitingRoom(roomId, userId);
    if (!waiting) {
      res.status(StatusCodes.NOT_FOUND).json({ error: "Room not found" });
      return;
    }
    res.status(StatusCodes.OK).json(waiting);
  } catch (err) {
    next(err);
  }
}

export async function leave(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const roomId = req.params.roomId!;
    const userId = req.userId!;
    await leaveWaitingRoom(roomId, userId);
    res.status(StatusCodes.NO_CONTENT).send();
  } catch (err) {
    next(err);
  }
}

export async function list(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const roomId = req.params.roomId!;
    const waitingUsers = await listWaitingUsers(roomId);
    res.status(StatusCodes.OK).json({ waitingUsers });
  } catch (err) {
    next(err);
  }
}

