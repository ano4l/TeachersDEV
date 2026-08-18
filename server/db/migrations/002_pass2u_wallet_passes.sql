CREATE TABLE IF NOT EXISTS wallet_passes (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider text NOT NULL CHECK (provider IN ('pass2u')),
  provider_pass_id text,
  status text NOT NULL CHECK (status IN ('pending','active','failed')),
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, provider)
);

CREATE UNIQUE INDEX IF NOT EXISTS wallet_passes_provider_id_idx ON wallet_passes(provider, provider_pass_id) WHERE provider_pass_id IS NOT NULL;

