import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../auth/jwt.service";

export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ error: "Missing or invalid authorization header" });
  }

  const token = authHeader.slice(7);
  try {
    const payload = await verifyAccessToken(token);
    req.user = { userId: payload.sub, roles: payload.roles };
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}
