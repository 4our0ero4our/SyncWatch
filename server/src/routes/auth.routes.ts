import { Router } from "express";
import * as authController from "../controllers/auth.controller";
import { requireAuth } from "../middlewares/requireAuth";

const router = Router();

router.post("/login", authController.authValidation, authController.login);

router.post("/refresh", requireAuth, authController.refresh);

export default router;
