export interface IMessage {
  roomId: string;
  userId: string;
  displayName?: string;
  avatar?: string;
  type: "text" | "reaction";
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export const MESSAGES_SUBCOLLECTION = "messages";
