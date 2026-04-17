import admin from "firebase-admin";
import { getFirestore } from "../config/firebase";
import { ROOMS_COLLECTION } from "../models/Room";
import { getUserProfile } from "./user.service";

const WAITING_SUBCOLLECTION = "waiting";
const WAITING_TTL_MS = 30000;

export type WaitingUser = {
  userId: string;
  displayName?: string;
  avatar?: string;
  createdAt?: Date;
  updatedAt?: Date;
};

export async function joinWaitingRoom(roomId: string, userId: string): Promise<WaitingUser | null> {
  const db = getFirestore();
  const roomRef = db.collection(ROOMS_COLLECTION).doc(roomId);
  const roomSnap = await roomRef.get();
  if (!roomSnap.exists) return null;
  const room = roomSnap.data() as { hostSessionActive?: boolean; isCompleted?: boolean } | undefined;
  if (room?.isCompleted === true) return null;
  if (room?.hostSessionActive === true) return null;

  const profile = await getUserProfile(userId);
  const ref = roomRef.collection(WAITING_SUBCOLLECTION).doc(userId);
  await ref.set(
    {
      userId,
      displayName: profile?.displayName ?? null,
      avatar: profile?.avatar ?? null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
  return {
    userId,
    displayName: profile?.displayName ?? undefined,
    avatar: profile?.avatar ?? undefined,
  };
}

export async function leaveWaitingRoom(roomId: string, userId: string): Promise<void> {
  const db = getFirestore();
  await db.collection(ROOMS_COLLECTION).doc(roomId).collection(WAITING_SUBCOLLECTION).doc(userId).delete();
}

export async function listWaitingUsers(roomId: string): Promise<WaitingUser[]> {
  const db = getFirestore();
  const roomRef = db.collection(ROOMS_COLLECTION).doc(roomId);
  const roomSnap = await roomRef.get();
  if (!roomSnap.exists) return [];
  const room = roomSnap.data() as { hostSessionActive?: boolean } | undefined;
  if (room?.hostSessionActive === true) {
    return [];
  }

  const snap = await roomRef.collection(WAITING_SUBCOLLECTION).orderBy("createdAt", "asc").get();
  const now = Date.now();
  const staleRefs: admin.firestore.DocumentReference[] = [];
  const active: WaitingUser[] = [];

  for (const d of snap.docs) {
    const data = d.data() as {
      userId?: string;
      displayName?: string;
      avatar?: string;
      createdAt?: admin.firestore.Timestamp;
      updatedAt?: admin.firestore.Timestamp;
    };
    const updatedAt = data.updatedAt?.toDate?.() ?? data.createdAt?.toDate?.();
    if (!updatedAt || now - updatedAt.getTime() > WAITING_TTL_MS) {
      staleRefs.push(d.ref);
      continue;
    }
    active.push({
      userId: data.userId ?? d.id,
      displayName: data.displayName ?? undefined,
      avatar: data.avatar ?? undefined,
      createdAt: data.createdAt?.toDate?.(),
      updatedAt,
    });
  }

  if (staleRefs.length > 0) {
    const batch = db.batch();
    staleRefs.forEach((ref) => batch.delete(ref));
    await batch.commit();
  }

  return active;
}

