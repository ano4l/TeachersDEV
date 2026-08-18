ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS latitude double precision,
  ADD COLUMN IF NOT EXISTS longitude double precision;

ALTER TABLE businesses
  ADD CONSTRAINT businesses_latitude_range CHECK (latitude IS NULL OR latitude BETWEEN -90 AND 90),
  ADD CONSTRAINT businesses_longitude_range CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180),
  ADD CONSTRAINT businesses_coordinates_pair CHECK ((latitude IS NULL) = (longitude IS NULL));

CREATE INDEX IF NOT EXISTS businesses_coordinates_idx ON businesses(latitude, longitude)
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
