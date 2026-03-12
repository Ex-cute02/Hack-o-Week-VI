import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

export const config = {
  PORT: parseInt(process.env.PORT || "3001", 10),
  NODE_ENV: process.env.NODE_ENV || "development",

  // Database
  DB_HOST: process.env.DB_HOST || "localhost",
  DB_PORT: parseInt(process.env.DB_PORT || "5432", 10),
  DB_NAME: process.env.DB_NAME || "wearable_iam",
  DB_USER: process.env.DB_USER || "postgres",
  DB_PASSWORD: process.env.DB_PASSWORD || "postgres",

  // KMS Simulation
  MASTER_KEY_HEX: process.env.MASTER_KEY_HEX || "",
  HMAC_SECRET_HEX: process.env.HMAC_SECRET_HEX || "",

  // JWT
  JWT_ISSUER: process.env.JWT_ISSUER || "wearable-iam.local",
  ACCESS_TOKEN_TTL: "15m" as const,
  REFRESH_TOKEN_TTL: "7d" as const,
  REFRESH_TOKEN_MAX_AGE_MS: 7 * 24 * 60 * 60 * 1000,

  // Rate Limiting
  REGISTER_RATE_LIMIT_WINDOW_MS: 60 * 60 * 1000,
  REGISTER_RATE_LIMIT_MAX: 5,
  LOGIN_RATE_LIMIT_WINDOW_MS: 15 * 60 * 1000,
  LOGIN_RATE_LIMIT_MAX: 10,
};
