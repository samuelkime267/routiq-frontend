"use client";

import type { ApiUser } from "@/types/api";

const TOKEN_KEY = "routiq.accessToken";
const USER_KEY = "routiq.user";
const TOKEN_COOKIE = "routiq_token";
const USER_COOKIE = "routiq_user";
const COOKIE_DAYS = 30;

function sharedCookieDomain() {
  if (typeof window === "undefined") return undefined;

  const host = window.location.hostname;

  if (host === "localhost" || host.endsWith(".localhost")) {
    return "localhost";
  }
  if (host === "127.0.0.1" || host === "::1") {
    return undefined;
  }

  const parts = host.split(".");
  return parts.length > 2 ? `.${parts.slice(-2).join(".")}` : undefined;
}

function writeCookie(name: string, value: string, maxAgeDays = COOKIE_DAYS) {
  if (typeof document === "undefined") return;

  const domain = sharedCookieDomain();
  const maxAge = maxAgeDays * 24 * 60 * 60;

  document.cookie = [
    `${name}=${encodeURIComponent(value)}`,
    "Path=/",
    `Max-Age=${maxAge}`,
    "SameSite=Lax",
    domain ? `Domain=${domain}` : "",
  ]
    .filter(Boolean)
    .join("; ");
}

function removeCookie(name: string) {
  if (typeof document === "undefined") return;

  const domain = sharedCookieDomain();
  document.cookie = [
    `${name}=`,
    "Path=/",
    "Max-Age=0",
    "SameSite=Lax",
    domain ? `Domain=${domain}` : "",
  ]
    .filter(Boolean)
    .join("; ");
}

function readCookie(name: string) {
  if (typeof document === "undefined") return null;

  const prefix = `${name}=`;
  const match = document.cookie
    .split(";")
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith(prefix));

  return match ? decodeURIComponent(match.slice(prefix.length)) : null;
}

function readLocal(key: string) {
  if (typeof window === "undefined") return null;

  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeLocal(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Storage can be unavailable in private or restricted contexts.
  }
}

function removeLocal(key: string) {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Ignore storage errors.
  }
}

export function setAccessToken(token: string) {
  writeLocal(TOKEN_KEY, token);
  writeCookie(TOKEN_COOKIE, token);
}

export function getAccessToken() {
  return readLocal(TOKEN_KEY) || readCookie(TOKEN_COOKIE);
}

export function saveUser(user: ApiUser) {
  const value = JSON.stringify(user);
  writeLocal(USER_KEY, value);
  writeCookie(USER_COOKIE, value);
}

export function getStoredUser(): ApiUser | null {
  const raw = readLocal(USER_KEY) || readCookie(USER_COOKIE);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as ApiUser;
  } catch {
    return null;
  }
}

export function saveAuth(accessToken: string, user: ApiUser) {
  setAccessToken(accessToken);
  saveUser(user);
}

export function clearAuth() {
  removeLocal(TOKEN_KEY);
  removeLocal(USER_KEY);
  removeCookie(TOKEN_COOKIE);
  removeCookie(USER_COOKIE);
}
