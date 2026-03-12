import { pool } from "../db/pool";
import { encryptAES256GCM, decryptAES256GCM } from "../crypto/aes";
import { deriveDEK } from "../crypto/kms";
import { ProfilePayload } from "../types";
import { logger } from "../utils/logger";

export async function syncProfile(
  userId: string,
  profileData: ProfilePayload,
): Promise<{ updatedAt: Date }> {
  const { dek, keyId } = deriveDEK(userId);

  // Serialize and encrypt the entire profile payload
  const plaintext = JSON.stringify(profileData);
  const encData = encryptAES256GCM(plaintext, dek);

  // UPSERT into user_profiles
  const result = await pool.query(
    `INSERT INTO user_profiles (user_id, profile_enc_data, key_id, updated_at)
     VALUES ($1, $2, $3, NOW())
     ON CONFLICT (user_id)
     DO UPDATE SET profile_enc_data = $2, key_id = $3, updated_at = NOW()
     RETURNING updated_at`,
    [userId, encData, keyId],
  );

  logger.info("Profile synced", { userId, keyId });
  return { updatedAt: result.rows[0].updated_at };
}

export async function getProfile(
  userId: string,
): Promise<ProfilePayload | null> {
  const result = await pool.query(
    "SELECT profile_enc_data, key_id FROM user_profiles WHERE user_id = $1",
    [userId],
  );

  if (result.rows.length === 0) {
    return null;
  }

  const { dek } = deriveDEK(userId);
  const decrypted = decryptAES256GCM(result.rows[0].profile_enc_data, dek);

  return JSON.parse(decrypted) as ProfilePayload;
}
