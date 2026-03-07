import { Response, NextFunction } from "express";
import Joi from "joi";
import { StatusCodes } from "http-status-codes";
import { AuthenticatedRequest } from "../middlewares/requireAuth";
import { createRoom, getRoomById, updateRoom, deleteRoom, getRoomsByHost, getRoomByInviteCode } from "../services/room.service";
import { validateBody } from "../middlewares/validateBody";

const createRoomSchema = Joi.object({
  name: Joi.string().trim().min(1).max(200).required(),
  description: Joi.string().trim().max(500).allow(""),
  movieTitle: Joi.string().trim().max(300).allow(""),
  movieImageUrl: Joi.string().uri().allow(""),
  videoUrl: Joi.string().trim().max(2000).allow(""),
});

const updateRoomSchema = Joi.object({
  name: Joi.string().trim().min(1).max(200),
  description: Joi.string().trim().max(500).allow(""),
  videoUrl: Joi.string().trim().min(1).max(2000).allow(""),
  progress: Joi.number().min(0),
  isCompleted: Joi.boolean(),
});

export async function create(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.userId!;
    const { name, description, movieTitle, movieImageUrl, videoUrl } = req.body as {
      name: string;
      description?: string;
      movieTitle?: string;
      movieImageUrl?: string;
      videoUrl?: string;
    };
    const room = await createRoom(
      {
        name,
        description: description?.trim() || undefined,
        movieTitle: movieTitle?.trim() || undefined,
        movieImageUrl: movieImageUrl?.trim() || undefined,
        videoUrl: videoUrl?.trim() || undefined,
      },
      userId
    );
    res.status(StatusCodes.CREATED).json(room);
  } catch (err) {
    next(err);
  }
}

export async function list(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.userId!;
    const isCompleted = req.query.isCompleted as string | undefined;
    let rooms = await getRoomsByHost(userId);
    if (isCompleted === "true") rooms = rooms.filter((r) => r.isCompleted === true);
    else if (isCompleted === "false") rooms = rooms.filter((r) => r.isCompleted === false);
    res.status(StatusCodes.OK).json(rooms);
  } catch (err) {
    next(err);
  }
}

export async function getById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const roomId = req.params.id;
    const room = await getRoomById(roomId);
    if (!room) {
      res.status(StatusCodes.NOT_FOUND).json({ error: "Room not found" });
      return;
    }
    res.status(StatusCodes.OK).json(room);
  } catch (err) {
    next(err);
  }
}

export async function getByInviteCode(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const code = req.params.code;
    const room = await getRoomByInviteCode(code);
    if (!room) {
      res.status(StatusCodes.NOT_FOUND).json({ error: "Room not found" });
      return;
    }
    res.status(StatusCodes.OK).json(room);
  } catch (err) {
    next(err);
  }
}

export async function update(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const roomId = req.params.id;
    const body = req.body as {
      name?: string;
      description?: string;
      videoUrl?: string;
      progress?: number;
      isCompleted?: boolean;
    };
    const room = await updateRoom(roomId, body);
    if (!room) {
      res.status(StatusCodes.NOT_FOUND).json({ error: "Room not found" });
      return;
    }
    res.status(StatusCodes.OK).json(room);
  } catch (err) {
    next(err);
  }
}

export async function remove(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const roomId = req.params.id;
    const deleted = await deleteRoom(roomId);
    if (!deleted) {
      res.status(StatusCodes.NOT_FOUND).json({ error: "Room not found" });
      return;
    }
    res.status(StatusCodes.NO_CONTENT).send();
  } catch (err) {
    next(err);
  }
}

export const createRoomValidation = validateBody(createRoomSchema);
export const updateRoomValidation = validateBody(updateRoomSchema);
