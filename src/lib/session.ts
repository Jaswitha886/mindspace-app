import { SignJWT, jwtVerify } from "jose";
import type { UserRole } from "@prisma/client";

// Stateless JWT sessions in an HTTP-only cookie (docs/API.md — Session Management).
// This module is imported from proxy.ts, so it must stay free of next/headers
// and Node-only crypto deps like bcrypt. Cookie-store helpers live in lib/auth.ts.

export const SESSION_COOKIE = "mindspace-session";
export const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export type SessionPayload = {
  userId: string;
  role: UserRole;
  name: string;
  email: string;
};

function secretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not set");
  return new TextEncoder().encode(secret);
}

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(new Date(Date.now() + SESSION_DURATION_MS))
    .sign(secretKey());
}

export async function verifySession(
  token: string | undefined,
): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify<SessionPayload>(token, secretKey(), {
      algorithms: ["HS256"],
    });
    // Reject tokens missing any field we set at login (e.g. a stale cookie
    // signed with the same secret by an older build) — force a fresh sign-in.
    if (
      !payload.userId ||
      !payload.role ||
      typeof payload.name !== "string" ||
      typeof payload.email !== "string"
    ) {
      return null;
    }
    return {
      userId: payload.userId,
      role: payload.role,
      name: payload.name,
      email: payload.email,
    };
  } catch {
    return null;
  }
}

/** Dashboard path for a role — used for login redirects and role-mismatch bounces. */
export function dashboardPath(role: UserRole): string {
  switch (role) {
    case "STUDENT":
      return "/student";
    case "COUNSELLOR":
      return "/counsellor";
    case "ADMIN":
      return "/admin";
  }
}
