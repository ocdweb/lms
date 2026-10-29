// Edge-safe session token helpers (used by middleware and server code).
import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "lms_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 14; // 14 days

export type SessionPayload = { uid: string; role: "ADMIN" | "EMPLOYEE" };

const secret = () => new TextEncoder().encode(process.env.AUTH_SECRET || "dev-insecure-secret");

export async function signSession(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(secret());
}

export async function verifySession(token?: string): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return { uid: String(payload.uid), role: payload.role === "ADMIN" ? "ADMIN" : "EMPLOYEE" };
  } catch {
    return null;
  }
}
