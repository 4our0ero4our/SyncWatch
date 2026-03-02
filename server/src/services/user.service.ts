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
 * Updates a user's profile fields (currently displayName and/or streamingProvider).
 */
export async function updateUserProfile(
  userId: string,
  updates: { displayName?: string; streamingProvider?: StreamingProvider }
): Promise<UserProfileResponse | null> {
  const db = getFirestore();
  const ref = db.collection(USERS_COLLECTION).doc(userId);
  const snap = await ref.get();
  if (!snap.exists) return null;

  const payload: Partial<IUser> & { updatedAt: admin.firestore.FieldValue } = {
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  } as any;

  if (typeof updates.displayName === "string") {
    (payload as any).displayName = updates.displayName;
  }
  if (updates.streamingProvider) {
    (payload as any).streamingProvider = updates.streamingProvider;
  }

  await ref.set(payload, { merge: true });
  return getUserProfile(userId);
}

/**
 * Legacy helper: updates only the streaming provider preference.
 */
export async function updateStreamingProvider(
  userId: string,
  streamingProvider: StreamingProvider
): Promise<UserProfileResponse | null> {
  return updateUserProfile(userId, { streamingProvider });
}
