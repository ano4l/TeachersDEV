CREATE EXTENSION IF NOT EXISTS citext;

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY,
  personal_email citext UNIQUE NOT NULL,
  password_hash text NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  mobile text,
  city text NOT NULL,
  sms_consent boolean NOT NULL DEFAULT false,
  sms_consent_version text,
  sms_consented_at timestamptz,
  work_email citext,
  educator_verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash text UNIQUE NOT NULL,
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS educator_verifications (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  work_email citext NOT NULL,
  token_hash text UNIQUE NOT NULL,
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS member_cards (
  id uuid PRIMARY KEY,
  user_id uuid UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  member_id text UNIQUE NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended')),
  issued_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS businesses (
  id text PRIMARY KEY,
  name text NOT NULL,
  category text NOT NULL,
  description text NOT NULL,
  image_url text NOT NULL,
  website_url text,
  distance text,
  hours text,
  is_open boolean,
  published boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS deals (
  id text PRIMARY KEY,
  business_id text NOT NULL REFERENCES businesses(id),
  title text NOT NULL,
  description text NOT NULL,
  channel text NOT NULL CHECK (channel IN ('in_person','online')),
  category text NOT NULL,
  restrictions text NOT NULL,
  promo_code_encrypted text,
  estimated_savings_cents integer NOT NULL CHECK (estimated_savings_cents >= 0),
  featured boolean NOT NULL DEFAULT false,
  sponsored boolean NOT NULL DEFAULT false,
  giveaway boolean NOT NULL DEFAULT false,
  starts_at timestamptz,
  ends_at timestamptz,
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS saved_deals (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  deal_id text NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, deal_id)
);

CREATE TABLE IF NOT EXISTS deal_use_reports (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  deal_id text NOT NULL REFERENCES deals(id),
  idempotency_key text NOT NULL,
  estimated_savings_cents integer NOT NULL CHECK (estimated_savings_cents >= 0),
  reported_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, idempotency_key)
);

CREATE TABLE IF NOT EXISTS analytics_events (
  id uuid PRIMARY KEY,
  event_type text NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  session_key text,
  business_id text REFERENCES businesses(id) ON DELETE SET NULL,
  deal_id text REFERENCES deals(id) ON DELETE SET NULL,
  idempotency_key text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS analytics_idempotency_idx ON analytics_events(user_id, idempotency_key) WHERE idempotency_key IS NOT NULL;

CREATE TABLE IF NOT EXISTS partner_inquiries (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  business_name text NOT NULL,
  business_email citext NOT NULL,
  proposed_deal text NOT NULL,
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sessions_token_idx ON sessions(token_hash);
CREATE INDEX IF NOT EXISTS verification_token_idx ON educator_verifications(token_hash);
CREATE INDEX IF NOT EXISTS deals_discovery_idx ON deals(published, channel, category);
CREATE INDEX IF NOT EXISTS report_user_idx ON deal_use_reports(user_id, reported_at DESC);
CREATE INDEX IF NOT EXISTS analytics_time_idx ON analytics_events(event_type, occurred_at DESC);
