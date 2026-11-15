-- Atomic snapshot persistence for the initial pilot. Row locking serializes writes,
-- including booking confirmation. Split into normalized tenant tables before scale.
CREATE TABLE IF NOT EXISTS venturelab_state (
  id integer PRIMARY KEY CHECK (id = 1),
  state jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
