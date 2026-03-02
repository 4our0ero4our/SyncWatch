/**
 * Room document: watch room metadata and current video URL.
 * Real-time playback state (play/pause/timestamp) lives in Firebase RTDB.
 */
export interface IRoom {
  name: string;
  hostId: string;
  inviteCode: string;
  description?: string;
  movieTitle?: string;
  movieImageUrl?: string;
  currentVideoUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Firestore collection name for rooms.
 * Each room document may contain subcollections like participants/messages.
 */
export const ROOMS_COLLECTION = "rooms";