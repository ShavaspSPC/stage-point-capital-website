import { createHmac, timingSafeEqual } from "crypto";

// Minimal shared-password gate for internal staff pages (not investor-facing).
// Stateless: the session cookie is a signed, expiring token, not a server-side
// session store. This is intentionally lightweight for a small internal team,
// not a general auth system.

export const ADMIN_COOKIE_NAME = "spm_admin_session";
const SESSION_LIFETIME_MS = 12 * 60 * 60 * 1000; // 12 hours

function secret(): string | undefined {
  const v = process.env.ADMIN_STAFF_PASSWORD;
  return v && v.trim().length > 0 ? v : undefined;
}

function sign(payload: string, key: string): string {
  return createHmac("sha256", key).update(payload).digest("hex");
}

export function checkPassword(candidate: string): boolean {
  const pw = secret();
  if (!pw) return false;
  const a = Buffer.from(candidate);
  const b = Buffer.from(pw);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function createSessionToken(): string | null {
  const pw = secret();
  if (!pw) return null;
  const expiresAt = Date.now() + SESSION_LIFETIME_MS;
  const payload = String(expiresAt);
  return `${payload}.${sign(payload, pw)}`;
}

export function isValidSessionToken(token: string | undefined): boolean {
  const pw = secret();
  if (!pw || !token) return false;
  const [payload, mac] = token.split(".");
  if (!payload || !mac) return false;
  const expected = sign(payload, pw);
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
  return Date.now() < Number(payload);
}
