import { Request, Response, NextFunction } from "express";
import { Router } from "express";
import * as roomController from "../controllers/room.controller";
import { requireAuth } from "../middlewares/requireAuth";
import { requireHost } from "../middlewares/requireHost";

const router = Router();

function mapIdToRoomId(req: Request, _res: Response, next: NextFunction): void {
  (req.params as Record<string, string>).roomId = req.params.id;
  next();
}

router.use(requireAuth);

router.get("/", roomController.list);
router.post("/", roomController.createRoomValidation, roomController.create);
router.get("/by-code/:code", roomController.getByInviteCode);
router.get("/:id", roomController.getById);
router.patch("/:id", mapIdToRoomId, requireHost, roomController.updateRoomValidation, roomController.update);
router.delete("/:id", mapIdToRoomId, requireHost, roomController.remove);

export default router;
