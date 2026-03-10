import { Server } from "socket.io";
import { AuthenticatedSocket } from "./socket.manager";
import { logger } from "../utils/logger";

export const ROOM_EVENTS = {
  USER_JOINED: "USER_JOINED",
  USER_LEFT: "USER_LEFT",
  VIDEO_STATE_CHANGED: "VIDEO_STATE_CHANGED",
} as const;

export function registerRoomEvents(io: Server, socket: AuthenticatedSocket): void {
  socket.on(
    "join_room",
    (roomId: string, callback?: (err?: string) => void) => {
      if (!roomId || typeof roomId !== "string") {
        callback?.("Invalid roomId");
        return;
      }
      socket.join(roomId);
      socket.data.roomId = roomId;
      io.to(roomId).emit(ROOM_EVENTS.USER_JOINED, {
        userId: socket.userId,
        socketId: socket.id,
      });
      callback?.();
    }
  );

  socket.on("leave_room", (roomId: string) => {
    socket.leave(roomId);
    if (socket.data.roomId === roomId) delete socket.data.roomId;
    io.to(roomId).emit(ROOM_EVENTS.USER_LEFT, { userId: socket.userId, socketId: socket.id });
  });

  socket.on(
    ROOM_EVENTS.VIDEO_STATE_CHANGED,
    (payload: { roomId: string; state: "playing" | "paused"; timestamp: number }) => {
      const { roomId, state, timestamp } = payload ?? {};
      if (!roomId || !state || typeof timestamp !== "number") {
        logger.warn("Invalid VIDEO_STATE_CHANGED payload", { payload });
        return;
      }
      io.to(roomId).emit(ROOM_EVENTS.VIDEO_STATE_CHANGED, {
        userId: socket.userId,
        state,
        timestamp,
        updatedAt: Date.now() / 1000,
      });
    }
  );
}
