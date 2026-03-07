import { logger } from "../utils/logger";
import { getFirestore } from "../config/firebase";
import { ROOMS_COLLECTION, IRoom } from "../models/Room";
import { PARTICIPANTS_SUBCOLLECTION, ParticipantRole } from "../models/Participant";
import admin from "firebase-admin";

const INVITE_CODE_LENGTH = 6;
const INVITE_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateInviteCode(): string {
  let code = "";
  for (let i = 0; i < INVITE_CODE_LENGTH; i++) {
    code += INVITE_CODE_CHARS[Math.floor(Math.random() * INVITE_CODE_CHARS.length)];
  }
  return code;
}

function toIsoDate(value: unknown): string {
  if (value instanceof admin.firestore.Timestamp) {
    return value.toDate().toISOString();
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  return new Date().toISOString();
}

export type CreateRoomInput = {
  name: string;
  description?: string;
  movieTitle?: string;
  movieImageUrl?: string;
  videoUrl?: string;
};

export type RoomResponse = {
  id: string;
  name: string;
  hostId: string;
  inviteCode: string;
  description?: string;
  movieTitle?: string;
  movieImageUrl?: string;
  videoUrl?: string;
  progress?: number;
  isCompleted?: boolean;
  createdAt: string;
  updatedAt: string;
};

/**
 * Creates a new room and adds the creator as host participant.
 * Generates a unique 6-char invite code.
 */
export async function createRoom(
  input: CreateRoomInput,
  hostId: string
): Promise<RoomResponse> {
  try {
    const db = getFirestore();
    const rooms = db.collection(ROOMS_COLLECTION);

    let inviteCode = "";
    for (let attempt = 0; attempt < 10; attempt++) {
      const candidate = generateInviteCode();
      const existing = await rooms.where("inviteCode", "==", candidate).limit(1).get();
      if (existing.empty) {
        inviteCode = candidate;
        break;
      }
    }
    if (!inviteCode) {
      throw new Error("Could not generate unique invite code");
    }

    const roomRef = rooms.doc();
    const now = admin.firestore.FieldValue.serverTimestamp();
    const roomData = {
      name: input.name,
      hostId,
      inviteCode,
      description: input.description ?? null,
      movieTitle: input.movieTitle ?? null,
      movieImageUrl: input.movieImageUrl ?? null,
      videoUrl: input.videoUrl ?? null,
      progress: 0,
      isCompleted: false,
      createdAt: now,
      updatedAt: now,
    };

    const batch = db.batch();
    batch.set(roomRef, roomData, { merge: false });
    const hostParticipantRef = roomRef.collection(PARTICIPANTS_SUBCOLLECTION).doc(hostId);
    const participant = {
      roomId: roomRef.id,
      userId: hostId,
      role: "host" as ParticipantRole,
      joinedAt: now,
      updatedAt: now,
    };
    batch.set(hostParticipantRef, participant, { merge: false });
    await batch.commit();

    const createdAt = new Date().toISOString();
    const updatedAt = createdAt;
    return {
      id: roomRef.id,
      name: input.name,
      hostId,
      inviteCode,
      description: input.description,
      movieTitle: input.movieTitle,
      movieImageUrl: input.movieImageUrl,
      videoUrl: input.videoUrl,
      progress: 0,
      isCompleted: false,
      createdAt,
      updatedAt,
    };
  } catch (err) {
    logger.error("createRoom failed", { error: err });
    throw err;
  }
}

export async function getRoomById(roomId: string): Promise<(RoomResponse & { videoUrl?: string }) | null> {
  const db = getFirestore();
  const snap = await db.collection(ROOMS_COLLECTION).doc(roomId).get();
  if (!snap.exists) return null;
  const data = snap.data() as Partial<IRoom>;
  const createdAt = toIsoDate((data as any).createdAt);
  const updatedAt = toIsoDate((data as any).updatedAt ?? createdAt);
  return {
    id: snap.id,
    name: data.name ?? "",
    hostId: data.hostId ?? "",
    inviteCode: data.inviteCode ?? "",
    description: data.description,
    movieTitle: data.movieTitle,
    movieImageUrl: data.movieImageUrl,
    videoUrl: data.videoUrl,
    progress: data.progress ?? 0,
    isCompleted: data.isCompleted ?? false,
    createdAt,
    updatedAt,
  };
}

/**
 * Lists rooms hosted by the given user (newest first).
 */
export async function getRoomsByHost(hostId: string): Promise<RoomResponse[]> {
  const db = getFirestore();
  const snap = await db.collection(ROOMS_COLLECTION).where("hostId", "==", hostId).get();
  const rooms = snap.docs.map((doc) => {
    const data = doc.data() as Partial<IRoom>;
    const createdAt = toIsoDate((data as any).createdAt);
    const updatedAt = toIsoDate((data as any).updatedAt ?? createdAt);
    return {
      id: doc.id,
      name: data.name ?? "",
      hostId: data.hostId ?? "",
      inviteCode: data.inviteCode ?? "",
      description: data.description,
      movieTitle: data.movieTitle,
      movieImageUrl: data.movieImageUrl,
      videoUrl: data.videoUrl,
      progress: data.progress ?? 0,
      isCompleted: data.isCompleted ?? false,
      createdAt,
      updatedAt,
    };
  });
  rooms.sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
  return rooms;
}

/**
 * Finds a room by its invite code (case-sensitive). Returns null if not found.
 */
export async function getRoomByInviteCode(inviteCode: string): Promise<RoomResponse | null> {
  const db = getFirestore();
  const trimmed = inviteCode.trim().toUpperCase();
  if (!trimmed) return null;
  const snap = await db.collection(ROOMS_COLLECTION).where("inviteCode", "==", trimmed).limit(1).get();
  if (snap.empty) return null;
  const doc = snap.docs[0];
  const data = doc.data() as Partial<IRoom>;
  const createdAt = toIsoDate((data as any).createdAt);
  const updatedAt = toIsoDate((data as any).updatedAt ?? createdAt);
  return {
    id: doc.id,
    name: data.name ?? "",
    hostId: data.hostId ?? "",
    inviteCode: data.inviteCode ?? "",
    description: data.description,
    movieTitle: data.movieTitle,
    movieImageUrl: data.movieImageUrl,
    videoUrl: data.videoUrl,
    progress: data.progress ?? 0,
    isCompleted: data.isCompleted ?? false,
    createdAt,
    updatedAt,
  };
}

/**
 * Updates room fields (e.g. name, videoUrl, progress, isCompleted). Only host should call this.
 */
export async function updateRoom(
  roomId: string,
  updates: {
    name?: string;
    description?: string;
    videoUrl?: string;
    progress?: number;
    isCompleted?: boolean;
  }
): Promise<RoomResponse | null> {
  const db = getFirestore();
  const ref = db.collection(ROOMS_COLLECTION).doc(roomId);
  const snap = await ref.get();
  if (!snap.exists) return null;
  const cleanUpdates: Record<string, string | number | boolean> = {};
  if (updates.name != null) cleanUpdates.name = updates.name;
  if (updates.description != null) cleanUpdates.description = updates.description;
  if (updates.videoUrl != null) cleanUpdates.videoUrl = updates.videoUrl;
  if (updates.progress != null) cleanUpdates.progress = updates.progress;
  if (updates.isCompleted != null) cleanUpdates.isCompleted = updates.isCompleted;
  await ref.set(
    {
      ...cleanUpdates,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
  return getRoomById(roomId);
}

/**
 * Deletes a room and all its participants.
 */
export async function deleteRoom(roomId: string): Promise<boolean> {
  try {
    const db = getFirestore();
    const ref = db.collection(ROOMS_COLLECTION).doc(roomId);
    const snap = await ref.get();
    if (!snap.exists) return false;
    await ref.delete();
    return true;
  } catch (err) {
    logger.error("deleteRoom failed", { error: err });
    throw err;
  }
}
