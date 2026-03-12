import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { handleSyncProfile, handleGetProfile } from "./profile.controller";

const router = Router();

router.put("/", authenticate, handleSyncProfile);
router.get("/", authenticate, handleGetProfile);

export { router as profileRouter };
