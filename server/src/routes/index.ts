import { Router } from "express";
import authRoutes from "./auth.routes";
import userRoutes from "./user.routes";
import roomRoutes from "./room.routes";
import participantRoutes from "./participant.routes";
import syncRoutes from "./sync.routes";
import chatRoutes from "./chat.routes";
import { health } from "../controllers/health.controller";

const router = Router();

router.get("/health", health);

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/rooms", roomRoutes);

router.use("/rooms/:roomId/participants", participantRoutes);
router.use("/rooms/:roomId/sync", syncRoutes);
router.use("/rooms/:roomId/messages", chatRoutes);

export default router;
