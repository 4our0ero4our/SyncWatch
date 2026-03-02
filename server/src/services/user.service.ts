import { getFirestore } from "../config/firebase";
import { USERS_COLLECTION, IUser, StreamingProvider } from "../models/User";
import admin from "firebase-admin";

export type UserProfileResponse = {
  id: string;
  email: string;
  displayName: string;
  avatar?: string;
  streamingProvider?: StreamingProvider;
};

/**
 * Gets a user's profile by ID.
 */
export async function getUserProfile(userId: string): Promise<UserProfileResponse | null> {
  const db = getFirestore();
  const snap = await db.collection(USERS_COLLECTION).doc(userId).get();
  if (!snap.exists) return null;
  const data = snap.data() as Partial<IUser>;
  return {
    id: snap.id,
    email: data.email ?? "",
    displayName: data.displayName ?? "",
    avatar: data.avatar,
    streamingProvider: data.streamingProvider,
  };
}

/**
 * Updates a user's streaming provider preference.
 */
export async function updateStreamingProvider(
  userId: string,
  streamingProvider: StreamingProvider
): Promise<UserProfileResponse | null> {
  const db = getFirestore();
  const ref = db.collection(USERS_COLLECTION).doc(userId);
  const snap = await ref.get();
  if (!snap.exists) return null;
  await ref.set(
    {
      streamingProvider,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
  return getUserProfile(userId);
}
