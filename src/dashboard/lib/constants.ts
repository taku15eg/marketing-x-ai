// Shared constants for Publish Gate

// Claude API
export const CLAUDE_MODEL = 'claude-sonnet-4-6';
export const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
export const CLAUDE_MAX_TOKENS = 4096;
export const CLAUDE_API_VERSION = '2023-06-01';

// Fetch limits (per CLAUDE.md security spec)
export const FETCH_TIMEOUT_MS = 10_000;
export const FETCH_MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
export const MAX_TEXT_LENGTH = 50_000;
export const MAX_REDIRECTS = 3;

// Screenshot
export const SCREENSHOT_TIMEOUT_MS = 15_000;
export const SCREENSHOT_VIEWPORT = { width: 1280, height: 800 };

// Page reader limits
export const MAX_TEXT_CONTENT_LENGTH = 10_000;
export const MAX_CTA_COUNT = 20;
export const MAX_IMAGE_COUNT = 50;
export const MAX_CTA_TEXT_LENGTH = 50;

// Analysis API
export const MAX_REQUEST_BODY_SIZE = 10_240; // 10KB
