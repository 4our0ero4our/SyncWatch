import { Router } from "express";
import * as syncController from "../controllers/sync.controller";
import { requireAuth } from "../middlewares/requireAuth";
import { requireHost } from "../middlewares/requireHost";

const router = Router({ mergeParams: true });

router.use(requireAuth);

router.get("/", syncController.getSync);

router.put("/", requireHost, syncController.syncBodyValidation, syncController.updateSync);

export default router;
