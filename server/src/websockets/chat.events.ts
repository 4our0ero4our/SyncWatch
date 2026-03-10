import { Server } from "socket.io";
import { AuthenticatedSocket } from "./socket.manager";
import { saveMessage } from "../services/chat.service";
import { logger } from "../utils/logger";

export const CHAT_EVENTS = {
  NEW_CHAT_MESSAGE: "NEW_CHAT_MESSAGE",
  NEW_REACTION: "NEW_REACTION",
} as const;

export function registerChatEvents(io: Server, socket: AuthenticatedSocket): void {
  socket.on(
    CHAT_EVENTS.NEW_CHAT_MESSAGE,
    async (payload: { roomId: string; type: "text" | "reaction"; content: string }) => {
      const { roomId, type, content } = payload ?? {};
      const userId = socket.userId;
      if (!roomId || !userId || !type || content === undefined) {
        logger.warn("Invalid NEW_CHAT_MESSAGE payload", { payload });
        return;
      }
      try {
        const message = await saveMessage(roomId, userId, type, content);
        io.to(roomId).emit(CHAT_EVENTS.NEW_CHAT_MESSAGE, message);
      } catch (err) {
        logger.error("saveMessage in socket failed", { roomId, error: err });
      }
    }
  );

  socket.on(
    CHAT_EVENTS.NEW_REACTION,
    async (payload: { roomId: string; content: string }) => {
      const { roomId, content } = payload ?? {};
      const userId = socket.userId;
      if (!roomId || !userId || content === undefined) {
        logger.warn("Invalid NEW_REACTION payload", { payload });
        return;
      }
      try {
        const message = await saveMessage(roomId, userId, "reaction", content);
        io.to(roomId).emit(CHAT_EVENTS.NEW_REACTION, message);
      } catch (err) {
        logger.error("saveMessage (reaction) in socket failed", { roomId, error: err });
      }
    }
  );
}
