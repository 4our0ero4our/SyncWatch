export interface IRoom {
  name: string;
  hostId: string;
  inviteCode: string;
  description?: string;
  movieTitle?: string;
  movieImageUrl?: string;
  videoUrl?: string;
  videoId?: string;
  progress?: number;
  isPlaying?: boolean;
  isCompleted?: boolean;
  hostSessionActive?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const ROOMS_COLLECTION = "rooms";