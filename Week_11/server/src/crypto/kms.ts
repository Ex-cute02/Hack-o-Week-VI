import crypto from "crypto";
import { config } from "../config";

const KEY_ID = "local-kms-v1";

/**
 * Local KMS simulation using HKDF.
 * Derives a per-user Data Encryption Key (DEK) from the master CMK + userId.
 */
export function deriveDEK(userId: string): { dek: Buffer; keyId: string } {
  if (!config.MASTER_KEY_HEX) {
    throw new Error("MASTER_KEY_HEX not configured");
  }

  const cmk = Buffer.from(config.MASTER_KEY_HEX, "hex");
  const dek = Buffer.from(
    crypto.hkdfSync("sha256", cmk, Buffer.alloc(0), userId, 32),
  );

  return { dek, keyId: KEY_ID };
}

/**
 * Derives a global DEK for email encryption (not per-user, since we need it
 * before we have a userId during registration).
 */
export function deriveEmailDEK(): { dek: Buffer; keyId: string } {
  if (!config.MASTER_KEY_HEX) {
    throw new Error("MASTER_KEY_HEX not configured");
  }

  const cmk = Buffer.from(config.MASTER_KEY_HEX, "hex");
  const dek = Buffer.from(
    crypto.hkdfSync(
      "sha256",
      cmk,
      Buffer.alloc(0),
      "email-encryption-global",
      32,
    ),
  );

  return { dek, keyId: KEY_ID };
}
