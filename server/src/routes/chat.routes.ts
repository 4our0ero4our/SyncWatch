import { Router } from "express";
import * as chatController from "../controllers/chat.controller";
import { requireAuth } from "../middlewares/requireAuth";

const router = Router({ mergeParams: true });

router.use(requireAuth);

router.get("/", chatController.listMessages);

router.post("/", chatController.sendMessageValidation, chatController.sendMessage);

export default router;
