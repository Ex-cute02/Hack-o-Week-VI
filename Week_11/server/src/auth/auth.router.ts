import { Router } from "express";
import {
  handleRegister,
  handleLogin,
  handleRefresh,
  handleLogout,
} from "./auth.controller";
import {
  registerRateLimiter,
  loginRateLimiter,
} from "../middleware/rate-limiter";

const router = Router();

router.post("/register", registerRateLimiter, handleRegister);
router.post("/login", loginRateLimiter, handleLogin);
router.post("/refresh", handleRefresh);
router.post("/logout", handleLogout);

export { router as authRouter };
