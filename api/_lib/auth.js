import crypto from "node:crypto";

const COOKIE_NAME = "krt_admin_session";
const SESSION_AGE = 60 * 60 * 24 * 7;

function encode(value) {
  return Buffer.from(value).toString("base64url");
}

function decode(value) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function signature(payload) {
  return crypto
    .createHmac("sha256", process.env.SESSION_SECRET)
    .update(payload)
    .digest("base64url");
}

function safeEqual(left, right) {
  const leftBuffer = Buffer.from(String(left));
  const rightBuffer = Buffer.from(String(right));
  return leftBuffer.length === rightBuffer.length
    && crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

export function authConfigured() {
  return Boolean(process.env.ADMIN_PASSWORD && process.env.SESSION_SECRET);
}

export function credentialsValid(username, password) {
  return username === "admin" && safeEqual(password, process.env.ADMIN_PASSWORD || "");
}

export function createSessionCookie() {
  const payload = encode(JSON.stringify({
    user: "admin",
    expiresAt: Date.now() + SESSION_AGE * 1000
  }));
  const token = `${payload}.${signature(payload)}`;
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_AGE}`;
}

export function clearSessionCookie() {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;
}

export function isAuthenticated(request) {
  if (!authConfigured()) {
    return false;
  }

  const cookieHeader = request.headers.cookie || "";
  const token = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${COOKIE_NAME}=`))
    ?.slice(COOKIE_NAME.length + 1);

  if (!token) {
    return false;
  }

  const [payload, tokenSignature] = token.split(".");
  if (!payload || !tokenSignature || !safeEqual(signature(payload), tokenSignature)) {
    return false;
  }

  try {
    const session = JSON.parse(decode(payload));
    return session.user === "admin" && Number(session.expiresAt) > Date.now();
  } catch {
    return false;
  }
}
