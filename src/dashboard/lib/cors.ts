// Shared CORS configuration for API routes
// '*' required for Chrome extension (chrome-extension:// origins are unpredictable)
// Phase 1+: restrict to dashboard origin + extension ID when auth is added

export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
} as const;
