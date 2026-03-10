import admin from "firebase-admin";
import { env } from "./env";
import { logger } from "../utils/logger";

let initialized = false;

export function initializeFirebase(): void {
  if (initialized) return;
  try {
    if (!env.FIREBASE_PROJECT_ID || !env.FIREBASE_CLIENT_EMAIL || !env.FIREBASE_PRIVATE_KEY) {
      logger.warn("Firebase env not set. Admin SDK will not be initialized");
      return;
    }
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: env.FIREBASE_PROJECT_ID,
        clientEmail: env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
      databaseURL: env.FIREBASE_DATABASE_URL || undefined,
    });
    initialized = true;
    logger.info("Firebase Admin initialized");
  } catch (err) {
    logger.error("Firebase Admin init error", { error: err });
    throw err;
  }
}

export function getFirebaseAuth(): admin.auth.Auth {
  if (!initialized) {
    throw new Error("Firebase Admin not initialized");
  }
  return admin.auth();
}

export function getFirebaseDatabase(): admin.database.Database {
  if (!initialized) {
    throw new Error("Firebase Admin not initialized");
  }
  return admin.database();
}

export function getFirestore(): admin.firestore.Firestore {
  if (!initialized) {
    throw new Error("Firebase Admin not initialized");
  }
  return admin.firestore();
}

export function isFirebaseInitialized(): boolean {
  return initialized;
}
