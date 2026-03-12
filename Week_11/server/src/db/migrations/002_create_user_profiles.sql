CREATE TABLE IF NOT EXISTS user_profiles (
  user_id           UUID PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
  profile_enc_data  BYTEA NOT NULL,
  key_id            VARCHAR(64) NOT NULL,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
