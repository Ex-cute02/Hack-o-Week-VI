import { pool } from "../db/pool";
import { hashPassword, verifyPassword, DUMMY_HASH } from "../crypto/argon2";
import { hmacSHA256 } from "../crypto/hmac";
import { encryptAES256GCM, decryptAES256GCM } from "../crypto/aes";
import { deriveEmailDEK } from "../crypto/kms";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "./jwt.service";
import { config } from "../config";
import { logger } from "../utils/logger";

export async function register(
  email: string,
  password: string,
): Promise<{ userId: string }> {
  const normalizedEmail = email.toLowerCase().trim();
  const emailHash = hmacSHA256(normalizedEmail, config.HMAC_SECRET_HEX);

  // Check for existing user
  const existing = await pool.query(
    "SELECT 1 FROM users WHERE email_hash = $1",
    [emailHash],
  );
  if (existing.rows.length > 0) {
    throw new RegistrationError("Registration failed");
  }

  // Hash password
  const passwordHash = await hashPassword(password);

  // Encrypt email for display
  const { dek } = deriveEmailDEK();
  const emailEncBuffer = encryptAES256GCM(normalizedEmail, dek);
  const emailEnc = emailEncBuffer.toString("base64");

  // Insert user
  const result = await pool.query(
    "INSERT INTO users (email_hash, email_enc, password) VALUES ($1, $2, $3) RETURNING user_id",
    [emailHash, emailEnc, passwordHash],
  );

  const userId = result.rows[0].user_id;
  logger.info("User registered", { userId });

  return { userId };
}

export async function login(
  email: string,
  password: string,
): Promise<{ accessToken: string; refreshToken: string }> {
  const normalizedEmail = email.toLowerCase().trim();
  const emailHash = hmacSHA256(normalizedEmail, config.HMAC_SECRET_HEX);

  const result = await pool.query(
    "SELECT user_id, password FROM users WHERE email_hash = $1",
    [emailHash],
  );

  if (result.rows.length === 0) {
    // Constant-time defense: still verify against dummy to prevent timing attacks
    await verifyPassword(DUMMY_HASH, password).catch(() => {});
    throw new AuthError("Invalid email or password");
  }

  const user = result.rows[0];
  const isValid = await verifyPassword(user.password, password);
  if (!isValid) {
    throw new AuthError("Invalid email or password");
  }

  const accessToken = await signAccessToken({
    sub: user.user_id,
    roles: ["user"],
  });
  const refreshToken = await signRefreshToken({ sub: user.user_id });

  logger.info("User logged in", { userId: user.user_id });

  return { accessToken, refreshToken };
}

export async function refresh(
  refreshTokenStr: string,
): Promise<{ accessToken: string; refreshToken: string }> {
  const payload = await verifyRefreshToken(refreshTokenStr);

  // Confirm user still exists
  const result = await pool.query("SELECT 1 FROM users WHERE user_id = $1", [
    payload.sub,
  ]);
  if (result.rows.length === 0) {
    throw new AuthError("User not found");
  }

  const accessToken = await signAccessToken({
    sub: payload.sub,
    roles: ["user"],
  });
  const newRefreshToken = await signRefreshToken({ sub: payload.sub });

  return { accessToken, refreshToken: newRefreshToken };
}

export class RegistrationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RegistrationError";
  }
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}
