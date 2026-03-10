import { logger } from "../utils/logger";

export async function connectDatabase(): Promise<void> {
  logger.info("connectDatabase called - using Firebase");
}

export async function disconnectDatabase(): Promise<void> {
  logger.info("disconnectDatabase called");
}
