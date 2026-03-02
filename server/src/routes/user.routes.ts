import { Router } from "express";
import * as userController from "../controllers/user.controller";
import { requireAuth } from "../middlewares/requireAuth";

const router = Router();
router.use(requireAuth);

/** GET /api/users/me - Get current user profile */
router.get("/me", userController.getMe);

/** PATCH /api/users/me - Update current user profile (streaming provider) */
router.patch("/me", userController.updateMeValidation, userController.updateMe);

export default router;
