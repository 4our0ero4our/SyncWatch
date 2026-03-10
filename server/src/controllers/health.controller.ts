import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { isFirebaseInitialized, getFirestore } from "../config/firebase";

export async function health(_req: Request, res: Response): Promise<void> {
  const firebaseInitialized = isFirebaseInitialized();
  let firestore: "ok" | "unavailable" = firebaseInitialized ? "ok" : "unavailable";
  if (firebaseInitialized) {
    try {
      await getFirestore().collection("_health").doc("ping").get();
      firestore = "ok";
    } catch {
      firestore = "unavailable";
    }
  }
  res.status(StatusCodes.OK).json({ status: "ok", firebaseInitialized, firestore });
}
