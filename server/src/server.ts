import { createServer } from "http";
import { env, validateEnv } from "./config/env";
import { connectDatabase, disconnectDatabase } from "./config/database";
import { initializeFirebase } from "./config/firebase";
import { createApp } from "./app";
import { createSocketServer } from "./websockets/socket.manager";
import { logger } from "./utils/logger";

async function main(): Promise<void> {
  const PORT = process.env.PORT || 8000;
  validateEnv();
  await connectDatabase();
  initializeFirebase();

  const app = createApp();
  const httpServer = createServer(app);
  createSocketServer(httpServer);

  httpServer.listen(PORT, () => {
    logger.info(`Server listening on port ${env.PORT}`);
  });
}

main().catch((err) => {
  logger.error("Fatal error", { error: err });
  process.exit(1);
});

process.on("SIGTERM", async () => {
  logger.info("SIGTERM received, shutting down");
  await disconnectDatabase();
  process.exit(0);
});
