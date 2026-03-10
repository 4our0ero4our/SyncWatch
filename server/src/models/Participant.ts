export type ParticipantRole = "host" | "viewer";

export interface IParticipant {
  roomId: string;
  userId: string;
  role: ParticipantRole;
  joinedAt: Date;
  updatedAt: Date;
}

export const PARTICIPANTS_SUBCOLLECTION = "participants";
