CREATE TABLE IF NOT EXISTS waitlist_signups (
  id uuid PRIMARY KEY,
  email citext UNIQUE NOT NULL,
  first_name text,
  city text,
  role text NOT NULL DEFAULT 'teacher' CHECK (role IN ('teacher','business','other')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS waitlist_created_idx ON waitlist_signups(created_at DESC);
