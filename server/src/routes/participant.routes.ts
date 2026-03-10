import { Router } from "express";
import * as participantController from "../controllers/participant.controller";
import { requireAuth } from "../middlewares/requireAuth";

const router = Router({ mergeParams: true });

router.use(requireAuth);

router.post("/join", participantController.join);

router.get("/", participantController.list);

router.delete("/:userId", participantController.kick);

export default router;