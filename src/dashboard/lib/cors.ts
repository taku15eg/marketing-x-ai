// Shared CORS configuration and API response helpers
// '*' required for Chrome extension (chrome-extension:// origins are unpredictable)
// Phase 1+: restrict to dashboard origin + extension ID when auth is added

import { NextResponse } from 'next/server';

export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
} as const;

/** CORS preflight response (204 No Content) */
export function corsPreflightResponse(): NextResponse {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

/** JSON error response with CORS headers */
export function errorResponse(
  error: string,
  status: number,
  extraHeaders?: Record<string, string>,
): NextResponse {
  return NextResponse.json(
    { error },
    { status, headers: { ...CORS_HEADERS, ...extraHeaders } },
  );
}

/** JSON success response with CORS headers */
export function jsonResponse<T>(
  data: T,
  status = 200,
  extraHeaders?: Record<string, string>,
): NextResponse {
  return NextResponse.json(data, {
    status,
    headers: { ...CORS_HEADERS, ...extraHeaders },
  });
}
