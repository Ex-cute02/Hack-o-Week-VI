import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { authRouter } from "./auth/auth.router";
import { profileRouter } from "./profile/profile.router";
import { errorHandler } from "./middleware/error-handler";
import { requestLogger } from "./middleware/request-logger";

export function createApp() {
  const app = express();

  // Security headers
  app.use(helmet());

  // CORS - allow the Vite dev server
  app.use(
    cors({
      origin: "http://localhost:5173",
      credentials: true,
    }),
  );

  // Body parsing
  app.use(express.json({ limit: "1mb" }));

  // Cookie parsing
  app.use(cookieParser());

  // Request logging
  app.use(requestLogger);

  // Routes
  app.use("/api/v1/auth", authRouter);
  app.use("/api/v1/profile", profileRouter);

  // Health check
  app.get("/health", (_req, res) => res.json({ status: "ok" }));

  // Global error handler (must be last)
  app.use(errorHandler);

  return app;
}
