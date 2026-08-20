CREATE UNIQUE INDEX IF NOT EXISTS deal_use_reports_once_idx
  ON deal_use_reports(user_id, deal_id);
