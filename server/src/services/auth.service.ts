import { getFirebaseAuth, getFirestore } from "../config/firebase";
import { USERS_COLLECTION, IUser, StreamingProvider } from "../models/User";
import { signToken } from "../utils/jwt.util";
import { logger } from "../utils/logger";

export type AuthProvider = "google" | "apple";

export async function verifyOAuthToken(
  idToken: string
): Promise<{ uid: string; email?: string; name?: string; picture?: string } | null> {
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
      avatar: data.avatar ?? avatar,
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
