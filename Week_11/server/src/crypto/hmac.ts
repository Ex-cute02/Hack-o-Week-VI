import crypto from "crypto";

/**
 * Computes a deterministic HMAC-SHA256 hash.
 * Used for email hashing to enable lookups without storing plaintext.
 */
export function hmacSHA256(data: string, secretHex: string): string {
  const key = Buffer.from(secretHex, "hex");
  return crypto.createHmac("sha256", key).update(data).digest("hex");
}
