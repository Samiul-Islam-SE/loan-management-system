-- =========================================
--  Extensions
-- =========================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;

-- =========================================
--  USERS & AUTH
-- =========================================
CREATE TABLE IF NOT EXISTS users (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email          CITEXT NOT NULL UNIQUE,
  password_hash  TEXT   NOT NULL,            -- bcrypt/argon2
  full_name      TEXT   NOT NULL,
  admin          BOOLEAN NOT NULL DEFAULT FALSE,
  is_active      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Account tokens (email verify / password reset)
CREATE TABLE IF NOT EXISTS user_tokens (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_type   TEXT NOT NULL CHECK (token_type IN ('VERIFY_EMAIL','RESET_PASSWORD')),
  token_hash   TEXT NOT NULL,                -- store hash, not raw token
  expires_at   TIMESTAMPTZ NOT NULL,
  used_at      TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Optional but recommended: DB-backed refresh sessions for JWT refresh
CREATE TABLE IF NOT EXISTS refresh_sessions (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),  -- session id (jti)
  user_id            UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  refresh_token_hash TEXT NOT NULL,            -- hash only
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_used_at       TIMESTAMPTZ,
  expires_at         TIMESTAMPTZ NOT NULL,     -- e.g., now() + interval '30 days'
  ip_address         INET,
  user_agent         TEXT,
  device_name        TEXT,                      -- e.g., "Office PC"
  is_revoked         BOOLEAN NOT NULL DEFAULT FALSE,
  replaced_by        UUID REFERENCES refresh_sessions(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS refresh_sessions_user_idx ON refresh_sessions (user_id);
CREATE INDEX IF NOT EXISTS refresh_sessions_exp_idx  ON refresh_sessions (expires_at);
CREATE INDEX IF NOT EXISTS refresh_sessions_rev_idx  ON refresh_sessions (is_revoked);

-- =========================================
--  LOANS
-- =========================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'loan_status') THEN
    CREATE TYPE loan_status AS ENUM ('OPEN','OVERDUE','RESOLVED','CANCELLED');
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS loans (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lender_id          UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  borrower_id        UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  principal_cents    BIGINT NOT NULL CHECK (principal_cents > 0),
  currency_code      CHAR(3) NOT NULL DEFAULT 'BDT',
  title              TEXT,
  note               TEXT,
  promised_due_date  DATE NOT NULL,            -- promised date
  status             loan_status NOT NULL DEFAULT 'OPEN',
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT lender_not_borrower CHECK (lender_id <> borrower_id)
);
CREATE INDEX IF NOT EXISTS loans_lender_idx   ON loans (lender_id);
CREATE INDEX IF NOT EXISTS loans_borrower_idx ON loans (borrower_id);
CREATE INDEX IF NOT EXISTS loans_status_idx   ON loans (status);
CREATE INDEX IF NOT EXISTS loans_due_idx      ON loans (promised_due_date);
CREATE INDEX IF NOT EXISTS loans_open_due_idx ON loans (promised_due_date) WHERE status='OPEN';

-- =========================================
--  REPAYMENTS
-- =========================================
CREATE TABLE IF NOT EXISTS repayments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id       UUID NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
  amount_cents  BIGINT NOT NULL CHECK (amount_cents > 0),
  paid_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  method        TEXT,                           -- 'CASH','BKASH','BANK','NAGAD', etc.
  note          TEXT,
  recorded_by   UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS repayments_loan_idx ON repayments (loan_id);
CREATE INDEX IF NOT EXISTS repayments_paid_idx ON repayments (paid_at);

-- Running balance view
CREATE OR REPLACE VIEW loan_balances AS
SELECT
  l.id AS loan_id,
  l.principal_cents,
  COALESCE(SUM(r.amount_cents), 0) AS total_paid_cents,
  (l.principal_cents - COALESCE(SUM(r.amount_cents), 0)) AS balance_cents
FROM loans l
LEFT JOIN repayments r ON r.loan_id = l.id
GROUP BY l.id;

-- =========================================
--  EMAIL TEMPLATES & OUTBOX
-- =========================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'email_status') THEN
    CREATE TYPE email_status AS ENUM ('QUEUED','SENT','FAILED','CANCELLED');
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS email_templates (
  key       TEXT PRIMARY KEY,                  -- 'LOAN_CREATED','LOAN_OVERDUE','LOAN_RESOLVED'
  subject   TEXT NOT NULL,
  body_md   TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS email_outbox (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  to_user_id       UUID REFERENCES users(id) ON DELETE SET NULL,
  to_email         CITEXT NOT NULL,
  template_key     TEXT REFERENCES email_templates(key) ON DELETE SET NULL,
  subject          TEXT NOT NULL,
  body_rendered    TEXT NOT NULL,
  status           email_status NOT NULL DEFAULT 'QUEUED',
  scheduled_for    TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at          TIMESTAMPTZ,
  reference_type   TEXT,                        -- 'LOAN','REPAYMENT'
  reference_id     UUID,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_error       TEXT,
  -- GENERATED column for daily-unique (Asia/Dhaka)
  scheduled_local_date DATE
    GENERATED ALWAYS AS ( (scheduled_for AT TIME ZONE 'Asia/Dhaka')::date ) STORED
);
CREATE INDEX IF NOT EXISTS email_outbox_status_sched_idx ON email_outbox (status, scheduled_for);
CREATE INDEX IF NOT EXISTS email_outbox_to_email_idx      ON email_outbox (to_email);
CREATE INDEX IF NOT EXISTS email_outbox_ref_idx           ON email_outbox (reference_type, reference_id);

-- One overdue email per loan per local day (IMMUTABLE-safe via generated column)
DROP INDEX IF EXISTS email_outbox_unique_daily_overdue;
CREATE UNIQUE INDEX email_outbox_unique_daily_overdue
  ON email_outbox (reference_id, scheduled_local_date)
  WHERE template_key = 'LOAN_OVERDUE';

-- =========================================
--  EVENTS / AUDIT
-- =========================================
CREATE TABLE IF NOT EXISTS loan_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id     UUID NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
  actor_id    UUID REFERENCES users(id) ON DELETE SET NULL,  -- system or user
  event_type  TEXT NOT NULL CHECK (event_type IN (
    'LOAN_CREATED','EMAIL_QUEUED','EMAIL_SENT',
    'REPAYMENT_POSTED','STATUS_CHANGED','PROMISE_UPDATED',
    'OVERDUE_MARKED','LOAN_RESOLVED'
  )),
  meta        JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS loan_events_loan_idx ON loan_events (loan_id, created_at);

-- =========================================
--  TRIGGERS & FUNCTIONS
-- =========================================

-- Touch updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_loans_touch ON loans;
CREATE TRIGGER trg_loans_touch
BEFORE UPDATE ON loans
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Queue borrower email on loan creation
CREATE OR REPLACE FUNCTION enqueue_email_on_loan_create()
RETURNS TRIGGER AS $$
DECLARE borrower_email CITEXT;
BEGIN
  SELECT email INTO borrower_email FROM users WHERE id = NEW.borrower_id;

  INSERT INTO email_outbox(
    to_user_id, to_email, template_key, subject, body_rendered,
    reference_type, reference_id, scheduled_for
  )
  VALUES (
    NEW.borrower_id,
    borrower_email,
    'LOAN_CREATED',
    'You received a loan',
    format(
      'Hi, a new loan of %s %s was issued to you. Promised date: %s.',
      NEW.currency_code, (NEW.principal_cents/100.0)::numeric::text, NEW.promised_due_date
    ),
    'LOAN', NEW.id, now()
  );

  INSERT INTO loan_events(loan_id, actor_id, event_type, meta)
  VALUES (NEW.id, NEW.lender_id, 'LOAN_CREATED',
          jsonb_build_object('promised_due_date', NEW.promised_due_date));

  RETURN NEW;
END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_email_on_loan_create ON loans;
CREATE TRIGGER trg_email_on_loan_create
AFTER INSERT ON loans
FOR EACH ROW EXECUTE FUNCTION enqueue_email_on_loan_create();

-- After repayment, auto-resolve if fully paid and email borrower
CREATE OR REPLACE FUNCTION resolve_if_fully_paid()
RETURNS TRIGGER AS $$
DECLARE principal BIGINT;
DECLARE paid BIGINT;
DECLARE borrower_email CITEXT;
BEGIN
  SELECT principal_cents INTO principal FROM loans WHERE id = NEW.loan_id;
  SELECT COALESCE(SUM(amount_cents),0) INTO paid FROM repayments WHERE loan_id = NEW.loan_id;

  IF paid >= principal THEN
    UPDATE loans SET status = 'RESOLVED' WHERE id = NEW.loan_id;

    SELECT u.email INTO borrower_email
    FROM loans l JOIN users u ON u.id = l.borrower_id
    WHERE l.id = NEW.loan_id;

    INSERT INTO email_outbox(
      to_user_id, to_email, template_key, subject, body_rendered,
      reference_type, reference_id, scheduled_for
    )
    SELECT l.borrower_id, borrower_email, 'LOAN_RESOLVED',
           'Your loan is fully repaid',
           'Congratulations! Your loan has been marked as resolved.',
           'LOAN', l.id, now()
    FROM loans l WHERE l.id = NEW.loan_id;

    INSERT INTO loan_events(loan_id, actor_id, event_type)
    VALUES (NEW.loan_id, NEW.recorded_by, 'LOAN_RESOLVED');
  END IF;

  INSERT INTO loan_events(loan_id, actor_id, event_type, meta)
  VALUES (NEW.loan_id, NEW.recorded_by, 'REPAYMENT_POSTED',
          jsonb_build_object('amount_cents', NEW.amount_cents));

  RETURN NEW;
END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_resolve_after_repayment ON repayments;
CREATE TRIGGER trg_resolve_after_repayment
AFTER INSERT ON repayments
FOR EACH ROW EXECUTE FUNCTION resolve_if_fully_paid();

-- Daily job: queue overdue reminders and mark loans OVERDUE
CREATE OR REPLACE FUNCTION enqueue_overdue_emails(run_at TIMESTAMPTZ DEFAULT now())
RETURNS INTEGER AS $$
DECLARE cnt INTEGER := 0;
BEGIN
  INSERT INTO email_outbox (
    to_user_id, to_email, template_key, subject, body_rendered,
    status, scheduled_for, reference_type, reference_id
  )
  SELECT
    u.id, u.email, 'LOAN_OVERDUE',
    'Your loan is overdue',
    format('Your loan (ID: %s) is overdue. Promised date was %s.', l.id, l.promised_due_date),
    'QUEUED', run_at, 'LOAN', l.id
  FROM loans l
  JOIN users u ON u.id = l.borrower_id
  LEFT JOIN email_outbox eo
    ON eo.reference_id = l.id
   AND eo.template_key = 'LOAN_OVERDUE'
   AND eo.scheduled_local_date = (run_at AT TIME ZONE 'Asia/Dhaka')::date
  WHERE l.status = 'OPEN'
    AND CURRENT_DATE > l.promised_due_date
    AND eo.id IS NULL;

  GET DIAGNOSTICS cnt = ROW_COUNT;

  UPDATE loans
     SET status = 'OVERDUE'
   WHERE status = 'OPEN'
     AND CURRENT_DATE > promised_due_date;

  INSERT INTO loan_events(loan_id, event_type)
  SELECT id, 'OVERDUE_MARKED' FROM loans
  WHERE status = 'OVERDUE' AND CURRENT_DATE > promised_due_date;

  RETURN cnt;
END; $$ LANGUAGE plpgsql;

-- =========================================
--  SEED TEMPLATES (optional)
-- =========================================
INSERT INTO email_templates(key, subject, body_md) VALUES
 ('LOAN_CREATED','You received a loan','Hi {{name}}, a loan of {{amount}} is issued. Promised date: {{date}}.')
 ON CONFLICT (key) DO NOTHING;

INSERT INTO email_templates(key, subject, body_md) VALUES
 ('LOAN_OVERDUE','Your loan is overdue','Hi {{name}}, your loan {{loan_id}} is overdue. Please settle soon.')
 ON CONFLICT (key) DO NOTHING;

INSERT INTO email_templates(key, subject, body_md) VALUES
 ('LOAN_RESOLVED','Loan fully repaid','Hi {{name}}, your loan {{loan_id}} is fully repaid. Thank you!')
 ON CONFLICT (key) DO NOTHING;
