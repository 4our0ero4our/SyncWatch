import { getFirestore } from "../config/firebase";
import { ROOMS_COLLECTION, IRoom } from "../models/Room";
import { PARTICIPANTS_SUBCOLLECTION, ParticipantRole } from "../models/Participant";
import admin from "firebase-admin";
import { getUserProfile } from "./user.service";

function forbidden(message: string): Error {
  const err = new Error(message);
  (err as Error & { statusCode?: number }).statusCode = 403;
  return err;
}

export async function removeAllViewersExceptHost(roomId: string, hostId: string): Promise<void> {
  const db = getFirestore();
  const roomRef = db.collection(ROOMS_COLLECTION).doc(roomId);
  const snaps = await roomRef.collection(PARTICIPANTS_SUBCOLLECTION).get();
  const batch = db.batch();
  let deletes = 0;
  for (const d of snaps.docs) {
    if (d.id !== hostId) {
      batch.delete(d.ref);
      deletes += 1;
    }
  }
  if (deletes > 0) await batch.commit();
}

export async function joinRoom(
  roomId: string,
  userId: string
): Promise<{ roomId: string; userId: string; role: ParticipantRole } | null> {
  const db = getFirestore();
  const roomRef = db.collection(ROOMS_COLLECTION).doc(roomId);
  const roomSnap = await roomRef.get();
  if (!roomSnap.exists) return null;

  const room = roomSnap.data() as Partial<IRoom>;
  const hostId = room.hostId ?? "";
  if (userId !== hostId) {
    if (room.isCompleted === true) {
      throw forbidden("This party has ended.");
    }
    if (room.hostSessionActive !== true) {
      throw forbidden("The host is not in the watch room yet.");
    }
  }

  const participantRef = roomRef.collection(PARTICIPANTS_SUBCOLLECTION).doc(userId);
  const existingSnap = await participantRef.get();
  if (existingSnap.exists) {
    const existing = existingSnap.data() as { role?: ParticipantRole };
    return { roomId, userId, role: existing.role ?? "viewer" };
  }

  const now = admin.firestore.FieldValue.serverTimestamp();
  await participantRef.set(
    {
      roomId,
      userId,
      role: "viewer" as ParticipantRole,
      joinedAt: now,
      updatedAt: now,
    },
    { merge: false }
  );
  return { roomId, userId, role: "viewer" };
}

export async function removeParticipant(roomId: string, userId: string, actorId: string): Promise<boolean> {
  const db = getFirestore();
  const roomRef = db.collection(ROOMS_COLLECTION).doc(roomId);
  const roomSnap = await roomRef.get();
  if (!roomSnap.exists) return false;
  const room = roomSnap.data() as IRoom;

  const actorIsHost = room.hostId === actorId;
  const isSelf = userId === actorId;
  if (!actorIsHost && !isSelf) return false;

  if (room.hostId === userId) return false;

  const participantRef = roomRef.collection(PARTICIPANTS_SUBCOLLECTION).doc(userId);
  const snap = await participantRef.get();
  if (!snap.exists) return false;
  await participantRef.delete();
  return true;
}

export async function listParticipants(
  roomId: string
): Promise<Array<{ userId: string; role: ParticipantRole; displayName?: string; avatar?: string }>> {
  const db = getFirestore();
  const roomRef = db.collection(ROOMS_COLLECTION).doc(roomId);
  const snaps = await roomRef.collection(PARTICIPANTS_SUBCOLLECTION).get();
  const list = await Promise.all(
    snaps.docs.map(async (d) => {
      const data = d.data() as { role?: ParticipantRole };
      const role = data.role ?? "viewer";
      let displayName: string | undefined;
      let avatar: string | undefined;
      try {
        const p = await getUserProfile(d.id);
        displayName = p?.displayName;
        avatar = p?.avatar;
      } catch {
        // ignore
      }
      return { userId: d.id, role, displayName, avatar };
    })
  );
  return list;
}

export async function isHost(roomId: string, userId: string): Promise<boolean> {
  const db = getFirestore();
  const snap = await db.collection(ROOMS_COLLECTION).doc(roomId).get();
  if (!snap.exists) return false;
  const room = snap.data() as Partial<IRoom>;
  return room.hostId === userId;
}
