-- MADD database schema. Safe to run more than once (npm run db:migrate).
-- Money is always stored as whole sen: RM 1.00 = 100.

CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  full_name     TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  phone         TEXT NOT NULL UNIQUE,          -- stored as +60XXXXXXXXX
  password_hash TEXT NOT NULL,
  pin_hash      TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- One wallet per user. The balance can never go below zero.
CREATE TABLE IF NOT EXISTS wallets (
  user_id     INT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  balance_sen BIGINT NOT NULL DEFAULT 0 CHECK (balance_sen >= 0),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS transactions (
  id           SERIAL PRIMARY KEY,
  sender_id    INT NOT NULL REFERENCES users(id),
  receiver_id  INT NOT NULL REFERENCES users(id),
  amount_sen   BIGINT NOT NULL CHECK (amount_sen > 0),
  note         TEXT,
  status       TEXT NOT NULL CHECK (status IN ('COMPLETED', 'PENDING', 'CANCELLED', 'EXPIRED')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  CHECK (sender_id <> receiver_id)
);
CREATE INDEX IF NOT EXISTS idx_transactions_sender ON transactions (sender_id, created_at);
CREATE INDEX IF NOT EXISTS idx_transactions_receiver ON transactions (receiver_id, created_at);

-- One row per login. The JWT carries this id, so the server can end a session before its 30 minutes are up.
CREATE TABLE IF NOT EXISTS sessions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at    TIMESTAMPTZ NOT NULL,
  revoked_at    TIMESTAMPTZ,                    -- set when the session is cancelled (logout, later: freeze)
  revoke_reason TEXT CHECK (revoke_reason IN ('logout', 'freeze'))
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions (user_id);
