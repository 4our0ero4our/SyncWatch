export type StreamingProvider = "netflix" | "prime";

export interface IUser {
  email: string;
  displayName: string;
  avatar?: string;
  provider: "google" | "apple";
  providerId: string;
  streamingProvider?: StreamingProvider;
  createdAt: Date;
  updatedAt: Date;
}

export const USERS_COLLECTION = "users";
