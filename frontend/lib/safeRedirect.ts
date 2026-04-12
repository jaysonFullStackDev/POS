// lib/safeRedirect.ts
// Validates redirect URLs against an allowlist of internal paths

const ALLOWED_PATHS = [
  '/dashboard',
  '/pos',
  '/pos/history',
  '/kitchen',
  '/inventory',
  '/inventory/products',
  '/accounting',
  '/reports',
  '/dashboard/users',
  '/audit',
  '/login',
  '/setup',
];

export function isAllowedRedirect(url: string): boolean {
  try {
    // Block absolute URLs / protocol-relative URLs (e.g. https://evil.com, //evil.com)
    if (/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(url) || url.startsWith('//')) return false;
    // Strip query string and hash, then match against allowlist
    const path = url.split('?')[0].split('#')[0];
    return ALLOWED_PATHS.includes(path);
  } catch {
    return false;
  }
}

export function getSafeRedirect(url: string | null | undefined, fallback: string): string {
  if (url && isAllowedRedirect(url)) return url;
  return fallback;
}
