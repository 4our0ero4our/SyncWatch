import dotenv from "dotenv";

dotenv.config();

const raw = {
  NODE_ENV: process.env.NODE_ENV ?? "development",
  PORT: process.env.PORT ?? "8000",
  JWT_SECRET: process.env.JWT_SECRET ?? "",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? "7d",
  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID ?? "",
  FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL ?? "",
  FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY ?? "",
  FIREBASE_DATABASE_URL: process.env.FIREBASE_DATABASE_URL ?? "",
  CORS_ORIGIN: process.env.CORS_ORIGIN ?? "*",
};

export const env = {
  NODE_ENV: raw.NODE_ENV as "development" | "production" | "test",
  PORT: parseInt(raw.PORT, 10),
  JWT_SECRET: raw.JWT_SECRET,
  JWT_EXPIRES_IN: raw.JWT_EXPIRES_IN,
  FIREBASE_PROJECT_ID: raw.FIREBASE_PROJECT_ID,
  FIREBASE_CLIENT_EMAIL: raw.FIREBASE_CLIENT_EMAIL,
  FIREBASE_PRIVATE_KEY: raw.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n") ?? "",
  FIREBASE_DATABASE_URL: raw.FIREBASE_DATABASE_URL,
  CORS_ORIGIN: raw.CORS_ORIGIN,
};

export function validateEnv(): void {
  const required = ["JWT_SECRET"];
  if (env.NODE_ENV !== "test") {
    const missing = required.filter((key) => !((process.env[key] ?? "").length > 0));
    if (missing.length > 0) {
      throw new Error(`Missing required env: ${missing.join(", ")}`);
    }

    const firebaseKeys = [
      "FIREBASE_PROJECT_ID",
      "FIREBASE_CLIENT_EMAIL",
      "FIREBASE_PRIVATE_KEY",
      "FIREBASE_DATABASE_URL",
    ];
    const firebaseMissing = firebaseKeys.filter((key) => !((process.env[key] ?? "").length > 0));
    if (firebaseMissing.length > 0) {
      throw new Error(`Missing required Firebase env: ${firebaseMissing.join(", ")}`);
    }
  }
}
