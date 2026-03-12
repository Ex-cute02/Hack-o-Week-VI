import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { config } from "../config";
import { logger } from "../utils/logger";

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: "Validation failed",
      details: err.errors.map((e) => ({
        path: e.path.join("."),
        message: e.message,
      })),
    });
  }

  logger.error("Unhandled error", {
    message: err.message,
    stack: err.stack,
    path: req.path,
  });
  const detail =
    config.NODE_ENV === "development" ? { debug: err.message } : {};
  return res.status(500).json({ error: "Internal server error", ...detail });
}
