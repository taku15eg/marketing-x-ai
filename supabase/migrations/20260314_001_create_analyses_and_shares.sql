-- Publish Gate: Analyses & Shares tables
-- Phase 0.5 → Production share URL persistence
--
-- Security:
--   - Share IDs are nanoid(21), not sequential (CLAUDE.md requirement)
--   - RLS enabled: analyses and shares are publicly readable (shared URLs are public)
--   - Insert is allowed via anon key (server-side API routes)
--   - No PII stored (per CLAUDE.md: screenshots are NOT stored, only JSON results)

-- ============================================================
-- 1. analyses table
-- ============================================================
CREATE TABLE IF NOT EXISTS analyses (
  id            TEXT PRIMARY KEY,           -- nanoid(21)
  url           TEXT NOT NULL,              -- analyzed URL
  status        TEXT NOT NULL DEFAULT 'processing'
                  CHECK (status IN ('processing', 'completed', 'error')),
  result        JSONB,                      -- AnalysisResult JSON (null if error)
  error         TEXT,                       -- error message (null if completed)
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at    TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '90 days')
);

-- Index for URL-based cache lookups
CREATE INDEX IF NOT EXISTS idx_analyses_url_created
  ON analyses (url, created_at DESC);

-- Index for expiration cleanup
CREATE INDEX IF NOT EXISTS idx_analyses_expires_at
  ON analyses (expires_at)
  WHERE expires_at IS NOT NULL;

-- ============================================================
-- 2. shares table
-- ============================================================
CREATE TABLE IF NOT EXISTS shares (
  id            TEXT PRIMARY KEY,           -- nanoid(21), the share ID in URLs
  analysis_id   TEXT NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at    TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '90 days'),
  view_count    INTEGER NOT NULL DEFAULT 0
);

-- Index for looking up shares by analysis
CREATE INDEX IF NOT EXISTS idx_shares_analysis_id
  ON shares (analysis_id);

-- ============================================================
-- 3. Row Level Security
-- ============================================================
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE shares ENABLE ROW LEVEL SECURITY;

-- Public read access (share URLs are public by design)
CREATE POLICY "analyses_public_read" ON analyses
  FOR SELECT USING (true);

CREATE POLICY "shares_public_read" ON shares
  FOR SELECT USING (true);

-- Server-side insert via anon key (API routes)
CREATE POLICY "analyses_insert" ON analyses
  FOR INSERT WITH CHECK (true);

CREATE POLICY "shares_insert" ON shares
  FOR INSERT WITH CHECK (true);

-- Allow view_count updates
CREATE POLICY "shares_update_view_count" ON shares
  FOR UPDATE USING (true)
  WITH CHECK (true);

-- ============================================================
-- 4. Events table (growth metrics)
-- ============================================================
CREATE TABLE IF NOT EXISTS events (
  id            BIGSERIAL PRIMARY KEY,
  type          TEXT NOT NULL,
  data          JSONB NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for event type queries and time-range aggregation
CREATE INDEX IF NOT EXISTS idx_events_type_created
  ON events (type, created_at DESC);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "events_insert" ON events
  FOR INSERT WITH CHECK (true);

CREATE POLICY "events_read" ON events
  FOR SELECT USING (true);

-- ============================================================
-- 5. Helper functions
-- ============================================================

-- Atomic view count increment (avoids SELECT+UPDATE race condition)
CREATE OR REPLACE FUNCTION increment_share_view_count(share_id_input TEXT)
RETURNS void AS $$
BEGIN
  UPDATE shares SET view_count = view_count + 1 WHERE id = share_id_input;
END;
$$ LANGUAGE plpgsql;

-- Expired records cleanup (call via pg_cron or manual)
CREATE OR REPLACE FUNCTION cleanup_expired_records()
RETURNS void AS $$
BEGIN
  DELETE FROM shares WHERE expires_at < NOW();
  DELETE FROM analyses WHERE expires_at < NOW()
    AND id NOT IN (SELECT analysis_id FROM shares);
END;
$$ LANGUAGE plpgsql;
