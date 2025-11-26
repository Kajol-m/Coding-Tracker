import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

const CSRF_TOKEN_LENGTH = 32;
const CSRF_TOKEN_HEADER = 'x-csrf-token';
const CSRF_TOKEN_COOKIE = 'csrf-token';

/**
 * Generate a CSRF token
 */
export function generateCsrfToken(): string {
  return crypto.randomBytes(CSRF_TOKEN_LENGTH).toString('hex');
}

/**
 * Validate CSRF token from request
 */
export function validateCsrfToken(req: NextRequest, token: string): boolean {
  const cookieToken = req.cookies.get(CSRF_TOKEN_COOKIE)?.value;
  
  if (!cookieToken || !token) {
    return false;
  }

  // Use constant-time comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(cookieToken),
    Buffer.from(token)
  );
}

/**
 * Set CSRF token cookie in response
 */
export function setCSRFCookie(response: NextResponse, token: string): void {
  response.cookies.set(CSRF_TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60, // 24 hours
    path: '/',
  });
}

/**
 * Get CSRF token from request (from header or body)
 */
export function getCsrfToken(req: NextRequest, body?: Record<string, unknown>): string | null {
  // Try header first
  const headerToken = req.headers.get(CSRF_TOKEN_HEADER);
  if (headerToken) return headerToken;

  // Try body
  if (body && typeof body === 'object' && '_csrf' in body) {
    const csrfFromBody = body._csrf;
    if (typeof csrfFromBody === 'string') return csrfFromBody;
  }

  return null;
}
