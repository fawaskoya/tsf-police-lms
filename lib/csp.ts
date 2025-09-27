import { NextRequest } from 'next/server';

export function generateNonce(): string {
  // Use Web Crypto API if available (browser), otherwise Node.js crypto
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode.apply(null, Array.from(array)));
  } else {
    // Node.js fallback
    const { randomBytes } = require('crypto');
    return randomBytes(16).toString('base64');
  }
}

export function getCSPHeader(nonce: string, isReportOnly = false): string {
  const directives = {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      `'nonce-${nonce}'`,
      "'unsafe-eval'", // Required for Next.js in development
      process.env.NODE_ENV === 'development' ? "'unsafe-inline'" : '',
    ].filter(Boolean),
    'style-src': [
      "'self'",
      `'nonce-${nonce}'`,
      "'unsafe-inline'", // Required for Tailwind CSS
    ],
    'img-src': [
      "'self'",
      'data:',
      'blob:',
      'https:',
    ],
    'font-src': [
      "'self'",
      'data:',
    ],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'none'"],
    'connect-src': [
      "'self'",
      process.env.METABASE_SITE_URL || '',
    ].filter(Boolean),
  };

  const cspString = Object.entries(directives)
    .map(([key, values]) => `${key} ${values.join(' ')}`)
    .join('; ');

  return isReportOnly ? `report-only ${cspString}` : cspString;
}

export function setCSPHeaders(request: NextRequest): { nonce: string; cspHeader: string } {
  const nonce = generateNonce();
  const isReportOnly = process.env.CSP_REPORT_ONLY === 'true';
  const cspHeader = getCSPHeader(nonce, isReportOnly);

  return { nonce, cspHeader };
}
