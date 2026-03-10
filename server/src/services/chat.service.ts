import admin from "firebase-admin";
import { getFirestore } from "../config/firebase";
import { ROOMS_COLLECTION } from "../models/Room";
import { PARTICIPANTS_SUBCOLLECTION } from "../models/Participant";
import { MESSAGES_SUBCOLLECTION } from "../models/Message";
import { getUserProfile } from "./user.service";

export async function saveMessage(
  roomId: string,
  userId: string,
  type: "text" | "reaction",
  content: string
): Promise<{ id: string; roomId: string; userId: string; displayName?: string; avatar?: string; type: string; content: string; createdAt: Date }> {
  const db = getFirestore();
  const roomRef = db.collection(ROOMS_COLLECTION).doc(roomId);
  const participantSnap = await roomRef.collection(PARTICIPANTS_SUBCOLLECTION).doc(userId).get();
  if (!participantSnap.exists) {
    const err = new Error("User is not a participant of this room");
    (err as Error & { statusCode?: number }).statusCode = 403;
    throw err;
  }

  const profile = await getUserProfile(userId);
  const displayName = profile?.displayName ?? undefined;
  const avatar = profile?.avatar ?? undefined;

  const messagesRef = roomRef.collection(MESSAGES_SUBCOLLECTION);
  const msgRef = messagesRef.doc();
  await msgRef.set(
    {
      roomId,
      userId,
      displayName: displayName ?? null,
      avatar: avatar ?? null,
      type,
      content,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: false }
  );

  return {
    id: msgRef.id,
    roomId,
    userId,
    displayName,
    avatar,
    type,
    content,
    createdAt: new Date(),
  };
}

export async function getMessages(
  roomId: string,
  limit: number = 50,
  before?: string
): Promise<Array<{ id: string; userId: string; displayName?: string; avatar?: string; type: string; content: string; createdAt: Date }>> {
  const db = getFirestore();
  const roomRef = db.collection(ROOMS_COLLECTION).doc(roomId);
  const messagesRef = roomRef.collection(MESSAGES_SUBCOLLECTION);

  let q: admin.firestore.Query = messagesRef.orderBy("createdAt", "desc").limit(limit);
  if (before) {
    const beforeSnap = await messagesRef.doc(before).get();
    if (beforeSnap.exists) {
      const beforeData = beforeSnap.data() as { createdAt?: admin.firestore.Timestamp };
      if (beforeData.createdAt) {
        q = q.startAfter(beforeData.createdAt);
      }
    }
  }

  const snap = await q.get();
  const userIds = [...new Set(snap.docs.map((d) => (d.data() as { userId?: string }).userId).filter(Boolean))] as string[];
  const nameMap: Record<string, string> = {};
  const avatarMap: Record<string, string> = {};
  await Promise.all(
    userIds.map(async (uid) => {
      try {
        const p = await getUserProfile(uid);
        if (p?.displayName) nameMap[uid] = p.displayName;
        if (p?.avatar) avatarMap[uid] = p.avatar;
      } catch {
        // ignore missing user
      }
    })
  );

  return snap.docs.map((d) => {
    const data = d.data();
    if (!data || typeof data.userId !== "string") {
      return {
        id: d.id,
        roomId,
        userId: "",
        displayName: undefined as string | undefined,
        avatar: undefined as string | undefined,
        type: (data?.type as string) ?? "text",
        content: (data?.content as string) ?? "",
        createdAt: (data?.createdAt as admin.firestore.Timestamp)?.toDate?.() ?? new Date(0),
      };
    }
    const displayName = (data.displayName as string | undefined) ?? nameMap[data.userId] ?? undefined;
    const avatar = (data.avatar as string | undefined) ?? avatarMap[data.userId] ?? undefined;
    return {
      id: d.id,
      roomId,
      userId: data.userId,
      displayName,
      avatar,
      type: (data.type as string) ?? "text",
      content: (data.content as string) ?? "",
      createdAt: (data.createdAt as admin.firestore.Timestamp)?.toDate?.() ?? new Date(0),
    };
  });
}
