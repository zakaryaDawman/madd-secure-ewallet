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

-- Task D2: the phone that sent each transfer, and when a held (PENDING) transfer runs out.
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS device_id UUID;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

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

-- Every login attempt, right or wrong (FR-9). user_id is empty when no account has the typed email.
CREATE TABLE IF NOT EXISTS login_attempts (
  id          SERIAL PRIMARY KEY,
  email       TEXT NOT NULL,
  user_id     INT REFERENCES users(id) ON DELETE CASCADE,
  device_id   UUID NOT NULL,
  success     BOOLEAN NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_login_attempts_user ON login_attempts (user_id, created_at);

-- Every PIN check (transfers, Change PIN), right or wrong. 5 wrong in a row lock transfers for 15 minutes (task C4).
CREATE TABLE IF NOT EXISTS pin_attempts (
  id          SERIAL PRIMARY KEY,
  user_id     INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  success     BOOLEAN NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_pin_attempts_user ON pin_attempts (user_id, created_at);

-- Phones each user has logged in from. The first one is trusted; later ones wait for rule R3 (task D4).
CREATE TABLE IF NOT EXISTS known_devices (
  user_id     INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_id   UUID NOT NULL,
  name        TEXT NOT NULL,
  trusted     BOOLEAN NOT NULL,
  first_seen  TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen   TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, device_id)
);

-- Security log (FR-16): every rule that fired and every hold that ran out. Append-only: see the triggers below.
CREATE TABLE IF NOT EXISTS security_events (
  id             SERIAL PRIMARY KEY,
  user_id        INT NOT NULL REFERENCES users(id),
  type           TEXT NOT NULL,
  rule           TEXT CHECK (rule IN ('R1', 'R2', 'R3', 'R4')),
  transaction_id INT REFERENCES transactions(id),
  reason         TEXT NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_security_events_transaction ON security_events (transaction_id);

-- The kinds of security event. Kept as a named constraint so new kinds can be added later.
ALTER TABLE security_events DROP CONSTRAINT IF EXISTS security_events_type_check;
ALTER TABLE security_events ADD CONSTRAINT security_events_type_check CHECK (type IN (
  'RULE_FIRED', 'HOLD_EXPIRED', 'HOLD_CONFIRMED', 'HOLD_REJECTED', 'ACCOUNT_FROZEN', 'PIN_LOCKED'
));

-- Task D3: set when the account is frozen. Only an admin can clear it.
ALTER TABLE users ADD COLUMN IF NOT EXISTS frozen_at TIMESTAMPTZ;

-- Refuses any change: rows can be added, never edited, deleted or emptied, not even by the server's own code.
CREATE OR REPLACE FUNCTION refuse_security_event_change() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'security_events is append-only: % is not allowed', TG_OP;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER security_events_no_edit
  BEFORE UPDATE OR DELETE ON security_events FOR EACH ROW EXECUTE FUNCTION refuse_security_event_change();
CREATE OR REPLACE TRIGGER security_events_no_truncate
  BEFORE TRUNCATE ON security_events FOR EACH STATEMENT EXECUTE FUNCTION refuse_security_event_change();
