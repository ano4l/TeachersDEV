CREATE TABLE IF NOT EXISTS deal_use_report_duplicates (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL,
  deal_id text NOT NULL,
  idempotency_key text NOT NULL,
  estimated_savings_cents integer NOT NULL,
  reported_at timestamptz NOT NULL,
  archived_at timestamptz NOT NULL DEFAULT now(),
  archive_reason text NOT NULL DEFAULT 'duplicate_user_deal'
);

WITH ranked_reports AS (
  SELECT
    r.*,
    row_number() OVER (
      PARTITION BY r.user_id, r.deal_id
      ORDER BY r.reported_at, r.id
    ) AS use_number
  FROM deal_use_reports r
)
INSERT INTO deal_use_report_duplicates (
  id,
  user_id,
  deal_id,
  idempotency_key,
  estimated_savings_cents,
  reported_at
)
SELECT
  id,
  user_id,
  deal_id,
  idempotency_key,
  estimated_savings_cents,
  reported_at
FROM ranked_reports
WHERE use_number > 1
ON CONFLICT (id) DO NOTHING;

DELETE FROM deal_use_reports r
USING deal_use_report_duplicates archived
WHERE r.id = archived.id;

CREATE UNIQUE INDEX IF NOT EXISTS deal_use_reports_once_idx
  ON deal_use_reports(user_id, deal_id);
