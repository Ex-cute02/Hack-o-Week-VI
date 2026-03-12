import crypto from "crypto";

const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const ALGORITHM = "aes-256-gcm";

/**
 * Encrypts plaintext using AES-256-GCM.
 * Returns a Buffer: iv (12 bytes) || authTag (16 bytes) || ciphertext
 */
export function encryptAES256GCM(plaintext: string, key: Buffer): Buffer {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return Buffer.concat([iv, authTag, encrypted]);
}

/**
 * Decrypts a buffer produced by encryptAES256GCM.
 * Expects: iv (12 bytes) || authTag (16 bytes) || ciphertext
 */
export function decryptAES256GCM(cipherBuffer: Buffer, key: Buffer): string {
  const iv = cipherBuffer.subarray(0, IV_LENGTH);
  const authTag = cipherBuffer.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const ciphertext = cipherBuffer.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}
