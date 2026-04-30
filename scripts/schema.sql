-- =============================================================================
-- Private Journal — database schema
--
-- Run this against your Neon database (or any Postgres 14+) once.
-- The setup-db.js script in /scripts does this for you.
-- =============================================================================

-- gen_random_uuid() requires pgcrypto; on Neon it's already available.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- -----------------------------------------------------------------------------
-- accounts — phone hash + secret hash. No journal content lives here.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS accounts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_hash      TEXT NOT NULL UNIQUE,
  secret_hash     TEXT NOT NULL,
  recovery_hash   TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_signin_at  TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS accounts_phone_idx ON accounts(phone_hash);

-- -----------------------------------------------------------------------------
-- entries — journal entries.
--
-- For v1 we store title and body in plaintext (per-account, per-row). The
-- account isolation + auth wall keeps them private from other users; the DB
-- operator can technically read them.
--
-- For full end-to-end encryption, replace `title` and `body` with `ciphertext`
-- (BYTEA) plus a wrapped per-entry key. The schema below has the columns
-- ready for that upgrade — title_ciphertext and body_ciphertext default to
-- NULL and are unused in v1.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS entries (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id   UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,

  -- v1: plaintext (server can read; users cannot read each other's)
  title        TEXT NOT NULL DEFAULT '',
  body         TEXT NOT NULL DEFAULT '',

  -- v2: end-to-end encrypted (unused in v1; populate when upgrading)
  title_ciphertext  BYTEA,
  body_ciphertext   BYTEA,
  nonce             BYTEA,
  wrapped_entry_key BYTEA,

  visibility   TEXT NOT NULL DEFAULT 'private'
                 CHECK (visibility IN ('private','link','public')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS entries_account_updated_idx
  ON entries(account_id, updated_at DESC);

-- -----------------------------------------------------------------------------
-- tasks — daily todos.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tasks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id  UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  done        BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tasks_account_idx ON tasks(account_id, created_at DESC);

-- -----------------------------------------------------------------------------
-- updated_at trigger — keep entries.updated_at fresh on every UPDATE.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION touch_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS entries_touch_updated_at ON entries;
CREATE TRIGGER entries_touch_updated_at
  BEFORE UPDATE ON entries
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
