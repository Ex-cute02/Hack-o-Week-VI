import rateLimit from "express-rate-limit";
import { config } from "../config";

export const registerRateLimiter = rateLimit({
  windowMs: config.REGISTER_RATE_LIMIT_WINDOW_MS,
  max: config.REGISTER_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many registration attempts. Try again later." },
});

export const loginRateLimiter = rateLimit({
  windowMs: config.LOGIN_RATE_LIMIT_WINDOW_MS,
  max: config.LOGIN_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many login attempts. Try again later." },
});
