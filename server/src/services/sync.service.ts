import { getFirebaseDatabase } from "../config/firebase";
import { getRoomById } from "./room.service";
import { logger } from "../utils/logger";

export interface PlaybackState {
  state: "playing" | "paused";
  timestamp: number;
  updatedAt: number;
  hostId: string;
}

export async function getPlaybackState(roomId: string): Promise<PlaybackState | null> {
  try {
    const db = getFirebaseDatabase();
    const ref = db.ref(`rooms/${roomId}/playback`);
    const snapshot = await ref.once("value");
    return snapshot.val();
  } catch (err) {
    logger.warn("getPlaybackState failed", { roomId, error: err });
    return null;
  }
}

export async function setPlaybackState(
  roomId: string,
  hostId: string,
  state: "playing" | "paused",
  timestamp: number
): Promise<boolean> {
  const room = await getRoomById(roomId);
  if (!room || room.hostId !== hostId) return false;
  try {
    const db = getFirebaseDatabase();
    const ref = db.ref(`rooms/${roomId}/playback`);
    await ref.set({
      state,
      timestamp,
      updatedAt: Date.now() / 1000,
      hostId,
    });
    return true;
  } catch (err) {
    logger.error("setPlaybackState failed", { roomId, error: err });
    throw err;
  }
}

export async function isPlaybackTimestampValid(
  roomId: string,
  timestamp: number,
  maxDriftSeconds: number = 5
): Promise<boolean> {
  const current = await getPlaybackState(roomId);
  if (!current) return true;
  const drift = Math.abs(current.timestamp - timestamp);
  return drift <= maxDriftSeconds;
}
