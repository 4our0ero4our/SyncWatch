import { getFirebaseAuth, getFirestore } from "../config/firebase";
import { USERS_COLLECTION, IUser, StreamingProvider } from "../models/User";
import { signToken } from "../utils/jwt.util";
import { logger } from "../utils/logger";

export type AuthProvider = "google" | "apple";

/**
 * Verifies an OAuth ID token (Google or Apple) and returns the decoded claims.
 * @param idToken - OAuth ID token from the client
 * @returns Decoded token claims or null if verification fails
 */
export async function verifyOAuthToken(idToken: string): Promise<{ uid: string; email?: string; name?: string; picture?: string } | null> {
  try {
    const auth = getFirebaseAuth();
    const decoded = await auth.verifyIdToken(idToken);
    return {
      uid: decoded.uid,
      email: decoded.email ?? undefined,
      name: decoded.name ?? undefined,
      picture: decoded.picture ?? undefined,
    };
  } catch (err) {
    logger.warn("OAuth token verification failed", { error: err });
    return null;
  }
}

/**
 * Finds or creates a user by provider and providerId, then returns a session JWT.
 * @param provider - "google" or "apple"
 * @param providerId - Firebase UID (or Apple subject)
 * @param email - User email
 * @param displayName - Display name
 * @param avatar - Optional avatar URL
 * @returns Session JWT and user document
 */
export async function findOrCreateUserAndSign(
  provider: AuthProvider,
  providerId: string,
  email: string,
  displayName: string,
  avatar?: string
): Promise<{
  token: string;
  user: {
    id: string;
    email: string;
    displayName: string;
    avatar?: string;
    streamingProvider?: StreamingProvider;
  };
}> {
  const db = getFirestore();
  const users = db.collection(USERS_COLLECTION);
  const docId = `${provider}:${providerId}`;
  const docRef = users.doc(docId);
  const now = new Date();
  const snap = await docRef.get();

  let user: IUser;
  if (!snap.exists) {
    user = {
      email,
      displayName,
      avatar,
      provider,
      providerId,
      createdAt: now,
      updatedAt: now,
    };
    await docRef.set(user);
  } else {
    const data = snap.data() as IUser;
    user = {
      ...data,
      email,
      displayName: data.displayName || displayName,
      avatar: avatar ?? data.avatar,
      updatedAt: now,
    };
    await docRef.set(user, { merge: true });
  }

  const token = signToken(docId, user.email);
  return {
    token,
    user: {
      id: docId,
      email: user.email,
      displayName: user.displayName,
      avatar: user.avatar,
      streamingProvider: user.streamingProvider,
    },
  };
}
