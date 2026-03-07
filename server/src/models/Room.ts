/**
 * Room document: watch room metadata, Vimeo video, and playback state.
 * Real-time playback sync can use Firebase RTDB separately.
 */
export interface IRoom {
  name: string;
  hostId: string;
  inviteCode: string;
  description?: string;
  movieTitle?: string;
  movieImageUrl?: string;
  videoUrl?: string;
  progress?: number;
  isCompleted?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Firestore collection name for rooms.
 * Each room document may contain subcollections like participants/messages.
 */
export const ROOMS_COLLECTION = "rooms";