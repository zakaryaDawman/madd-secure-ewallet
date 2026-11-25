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
  'RULE_FIRED', 'HOLD_EXPIRED', 'HOLD_CONFIRMED', 'HOLD_REJECTED', 'ACCOUNT_FROZEN', 'PIN_LOCKED', 'DEVICE_TRUSTED',
  'ADMIN_FREEZE', 'ADMIN_UNFREEZE', 'ADMIN_TRUST_DEVICE', 'OTP_SENT', 'OTP_LOCKED', 'EMAIL_VERIFIED',
  'ADMIN_ADD_USER', 'ADMIN_EDIT_USER', 'ADMIN_DEACTIVATE', 'INVITE_ACCEPTED', 'PHONE_CHANGED'
));

-- Task E4: which admin did it (empty for things users and rules do). The admin's written reason goes in `reason`.
ALTER TABLE security_events ADD COLUMN IF NOT EXISTS actor_id INT REFERENCES users(id);

-- Task E2: the numbers a rule used (e.g. amount, average, limit), so the admin sees the exact calculation.
ALTER TABLE security_events ADD COLUMN IF NOT EXISTS details JSONB;

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

-- Inbox (task D6): one row per thing the user should be told about. The text is built when it is read,
-- so it always matches the transfer or device as it is now.
CREATE TABLE IF NOT EXISTS notifications (
  id             SERIAL PRIMARY KEY,
  user_id        INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind           TEXT NOT NULL CHECK (kind IN (
    'MONEY_RECEIVED', 'MONEY_SENT', 'TRANSFER_HELD', 'HOLD_CONFIRMED', 'NEW_DEVICE', 'LOGIN_LOCKED', 'PIN_LOCKED', 'WELCOME'
  )),
  transaction_id INT REFERENCES transactions(id),
  device_id      UUID,
  read_at        TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications (user_id, created_at);

-- Task D7: each phone's Firebase push token (only trusted phones are ever sent alerts).
ALTER TABLE known_devices ADD COLUMN IF NOT EXISTS push_token TEXT;

-- Task D7: one row per push alert, to measure how long it took from the event to sending the push (for Chapter 6).
CREATE TABLE IF NOT EXISTS push_log (
  id         SERIAL PRIMARY KEY,
  user_id    INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind       TEXT NOT NULL CHECK (kind IN ('TRANSFER_HELD', 'NEW_DEVICE', 'LOGIN_LOCKED')),
  phones     INT NOT NULL,          -- how many trusted phones it was sent to
  ok         BOOLEAN NOT NULL,      -- false if Firebase refused it (or push is not set up)
  event_at   TIMESTAMPTZ NOT NULL,  -- when the held transfer / login happened
  sent_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Task G4: one-time codes emailed to the owner (held transfers now; sign-up in G4b). Only the bcrypt hash is stored.
CREATE TABLE IF NOT EXISTS email_otps (
  id             SERIAL PRIMARY KEY,
  user_id        INT NOT NULL REFERENCES users(id),
  purpose        TEXT NOT NULL CHECK (purpose IN ('HOLD', 'SIGNUP')),
  transaction_id INT REFERENCES transactions(id),
  code_hash      TEXT NOT NULL,
  expires_at     TIMESTAMPTZ NOT NULL,
  attempts       INT NOT NULL DEFAULT 0,
  sends          INT NOT NULL DEFAULT 1,
  last_sent_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  used_at        TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_email_otps_transaction ON email_otps (transaction_id) WHERE transaction_id IS NOT NULL;

-- Task G4b: when the owner proved the email is theirs with the sign-up code. Accounts that existed before G4b are
-- counted as verified (the DEFAULT fills them once, when the column is added); new accounts start empty.
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE users ALTER COLUMN email_verified_at DROP DEFAULT;
-- One sign-up code per user: "Resend" replaces it.
CREATE UNIQUE INDEX IF NOT EXISTS idx_email_otps_signup ON email_otps (user_id) WHERE purpose = 'SIGNUP';

-- Task G10: admins add, edit and deactivate customers.
-- A deactivated account can't sign in, can't be paid and is never deleted (its transfers and log rows stay).
ALTER TABLE users ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMPTZ;
ALTER TABLE sessions DROP CONSTRAINT IF EXISTS sessions_revoke_reason_check;
ALTER TABLE sessions ADD CONSTRAINT sessions_revoke_reason_check CHECK (revoke_reason IN ('logout', 'freeze', 'admin'));
-- An admin-added customer gets an INVITE code by email and sets their own password and PIN with it.
ALTER TABLE email_otps DROP CONSTRAINT IF EXISTS email_otps_purpose_check;
ALTER TABLE email_otps ADD CONSTRAINT email_otps_purpose_check CHECK (purpose IN ('HOLD', 'SIGNUP', 'INVITE', 'PHONE'));
CREATE UNIQUE INDEX IF NOT EXISTS idx_email_otps_invite ON email_otps (user_id) WHERE purpose = 'INVITE';

-- Task G11: the owner changes their phone number with their PIN and a code emailed to them. The new number waits here
-- until the code is right. One open change per user: asking again replaces it.
ALTER TABLE email_otps ADD COLUMN IF NOT EXISTS new_phone TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_email_otps_phone ON email_otps (user_id) WHERE purpose = 'PHONE';
