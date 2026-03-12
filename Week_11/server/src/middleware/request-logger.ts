import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    logger.info("HTTP Request", {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration_ms: duration,
      ip: req.ip,
    });
  });

  next();
}
