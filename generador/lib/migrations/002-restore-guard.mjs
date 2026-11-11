export const version = 2;
export const sql = `
CREATE TABLE restore_reconciliation (
  id INTEGER PRIMARY KEY CHECK(id=1),
  required INTEGER NOT NULL CHECK(required IN (0,1)),
  period_key TEXT NOT NULL,
  prior_dataset_id TEXT NOT NULL,
  prior_known_microusd INTEGER NOT NULL CHECK(prior_known_microusd>=0),
  prior_uncertain_microusd INTEGER NOT NULL CHECK(prior_uncertain_microusd>=0),
  prior_usage_available INTEGER NOT NULL DEFAULT 1 CHECK(prior_usage_available IN (0,1)),
  created_at TEXT NOT NULL,
  resolved_at TEXT,
  reason TEXT
);
`;
