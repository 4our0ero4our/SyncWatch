import { Router } from "express";
import * as waitingController from "../controllers/waiting.controller";
import { requireAuth } from "../middlewares/requireAuth";

const router = Router({ mergeParams: true });

router.use(requireAuth);

router.get("/", waitingController.list);
router.post("/join", waitingController.join);
router.delete("/leave", waitingController.leave);

export default router;

