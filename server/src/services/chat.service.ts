import admin from "firebase-admin";
import { getFirestore } from "../config/firebase";
import { ROOMS_COLLECTION } from "../models/Room";
import { PARTICIPANTS_SUBCOLLECTION } from "../models/Participant";
import { MESSAGES_SUBCOLLECTION } from "../models/Message";

/**
 * Saves a text or reaction message to the room.
 * @param roomId - Room ID
 * @param userId - Sender user ID
 * @param type - "text" or "reaction"
 * @param content - Message body or reaction emoji/code
 */
export async function saveMessage(
  roomId: string,
  userId: string,
  type: "text" | "reaction",
  content: string
): Promise<{ id: string; roomId: string; userId: string; type: string; content: string; createdAt: Date }> {
  const db = getFirestore();
  const roomRef = db.collection(ROOMS_COLLECTION).doc(roomId);
  const participantSnap = await roomRef.collection(PARTICIPANTS_SUBCOLLECTION).doc(userId).get();
  if (!participantSnap.exists) {
    const err = new Error("User is not a participant of this room");
    (err as Error & { statusCode?: number }).statusCode = 403;
    throw err;
  }

  const messagesRef = roomRef.collection(MESSAGES_SUBCOLLECTION);
  const msgRef = messagesRef.doc();
  await msgRef.set(
    {
      roomId,
      userId,
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
    type,
    content,
    createdAt: new Date(),
  };
}

/**
 * Fetches paginated messages for a room (newest first).
 * @param roomId - Room ID
 * @param limit - Max number of messages (default 50)
 * @param before - Cursor (message ID) for pagination; fetch messages before this
 */
export async function getMessages(
  roomId: string,
  limit: number = 50,
  before?: string
): Promise<Array<{ id: string; userId: string; type: string; content: string; createdAt: Date }>> {
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
  return snap.docs.map((d) => {
    const data = d.data() as {
      userId: string;
      type: string;
      content: string;
      createdAt?: admin.firestore.Timestamp;
    };
    return {
      id: d.id,
      roomId,
      userId: data.userId,
      type: data.type,
      content: data.content,
      createdAt: data.createdAt?.toDate?.() ?? new Date(0),
    };
  });
}
