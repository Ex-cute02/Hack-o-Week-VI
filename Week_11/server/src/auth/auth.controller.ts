import { Request, Response, NextFunction } from "express";
import { registerSchema, loginSchema } from "./auth.validation";
import * as authService from "./auth.service";
import { config } from "../config";
import { logger } from "../utils/logger";

export async function handleRegister(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { email, password } = registerSchema.parse(req.body);
    const result = await authService.register(email, password);
    res
      .status(201)
      .json({ message: "User registered", user_id: result.userId });
  } catch (err) {
    if (err instanceof authService.RegistrationError) {
      return res.status(409).json({ error: err.message });
    }
    next(err);
  }
}

export async function handleLogin(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const { accessToken, refreshToken } = await authService.login(
      email,
      password,
    );

    // Set refresh token as HttpOnly cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: config.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: config.REFRESH_TOKEN_MAX_AGE_MS,
      path: "/api/v1/auth",
    });

    res.json({ access_token: accessToken, expires_in: 900 });
  } catch (err) {
    if (err instanceof authService.AuthError) {
      return res.status(401).json({ error: err.message });
    }
    next(err);
  }
}

export async function handleRefresh(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ error: "No refresh token provided" });
    }

    const { accessToken, refreshToken: newRefreshToken } =
      await authService.refresh(refreshToken);

    // Rotate refresh token
    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: config.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: config.REFRESH_TOKEN_MAX_AGE_MS,
      path: "/api/v1/auth",
    });

    res.json({ access_token: accessToken, expires_in: 900 });
  } catch (err) {
    if (err instanceof authService.AuthError) {
      return res.status(401).json({ error: err.message });
    }
    logger.warn("Refresh token verification failed", {
      error: (err as Error).message,
    });
    return res.status(401).json({ error: "Invalid or expired refresh token" });
  }
}

export async function handleLogout(_req: Request, res: Response) {
  res.clearCookie("refreshToken", { path: "/api/v1/auth" });
  res.json({ message: "Logged out" });
}
