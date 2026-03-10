/**
 * Publish Gate v0.5 - Shared Constants
 * Phase 0.5 MVP: Web Dashboard (Tab 1 only) + Shared URL + Chrome Extension Side Panel
 */

// --- API ---
// In production, replace with the deployed URL (e.g., https://publishgate.jp)
// Build tools can override this via environment variables
const API_BASE = typeof process !== 'undefined' && process.env?.PUBLISH_GATE_API_BASE
  ? process.env.PUBLISH_GATE_API_BASE
  : 'http://localhost:3000';

// --- Endpoints ---
const ENDPOINTS = {
  ANALYZE: `${API_BASE}/api/analyze`,
};

// --- PII Masking Patterns ---
const MASK_PATTERNS = [
  { regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, replacement: '[EMAIL]' },
  { regex: /0\d{1,4}-?\d{1,4}-?\d{3,4}/g, replacement: '[PHONE]' },
  { regex: /\d{3}-?\d{4}/g, replacement: '[ZIPCODE]' },
];

// --- Version ---
const VERSION = '0.5.0';
