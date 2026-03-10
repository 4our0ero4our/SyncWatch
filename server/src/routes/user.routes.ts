import { Router } from "express";
import * as userController from "../controllers/user.controller";
import { requireAuth } from "../middlewares/requireAuth";

const router = Router();
router.use(requireAuth);

router.get("/me", userController.getMe);

router.patch("/me", userController.updateMeValidation, userController.updateMe);

export default router;
