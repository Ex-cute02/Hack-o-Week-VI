CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
  user_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_hash    VARCHAR(64) NOT NULL UNIQUE,
  email_enc     TEXT NOT NULL,
  password      VARCHAR(256) NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email_hash ON users(email_hash);
