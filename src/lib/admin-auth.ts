import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";

export const ADMIN_COOKIE = "venturelab_admin";
export const SESSION_SECONDS = 12 * 60 * 60;

export function adminConfigured(): boolean {
  return (process.env.ADMIN_SESSION_SECRET?.length || 0) >= 32;
}

function safeEquals(a: string, b: string): boolean {
  const aHash = createHash("sha256").update(a).digest();
  const bHash = createHash("sha256").update(b).digest();
  return timingSafeEqual(aHash, bHash);
}

export function checkAdminPassword(candidate: string): boolean {
  return adminConfigured() && !!process.env.ADMIN_PASSWORD && safeEquals(candidate, process.env.ADMIN_PASSWORD);
}

function sign(payload: string): string {
  return createHmac("sha256", process.env.ADMIN_SESSION_SECRET!)
    .update(payload).digest("base64url");
}

export function createAdminSession(scope = "*"): string {
  if (!adminConfigured()) throw new Error("Admin credentials not configured");
  const payload = Buffer.from(JSON.stringify({expiresAt: Date.now() + SESSION_SECONDS * 1000, scope})).toString("base64url");
  return payload + "." + sign(payload);
}

export function verifyAdminSession(cookie?: string): boolean {
  if (!adminConfigured() || !cookie) return false;
  const parts = cookie.split(".");
  if (parts.length !== 2 || !parts[0] || !parts[1]) return false;
  if (!safeEquals(parts[1], sign(parts[0]))) return false;
  try {
    const { expiresAt, scope } = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8"));
    return typeof scope === "string" && Number.isSafeInteger(expiresAt) && expiresAt > Date.now() && expiresAt < Date.now() + SESSION_SECONDS * 1000 + 60_000;
  } catch { return false; }
}

export function isAdminRequest(req: NextRequest): boolean {
  return verifyAdminSession(req.cookies.get(ADMIN_COOKIE)?.value);
}

export function sessionScope(cookie?: string): string | null {
  if (!verifyAdminSession(cookie)) return null;
  return JSON.parse(Buffer.from(cookie!.split('.')[0], 'base64url').toString('utf8')).scope;
}
