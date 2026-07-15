import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  SESSION_COOKIE,
  SESSION_DURATION_MS,
  dashboardPath,
  signSession,
  verifySession,
  type SessionPayload,
} from "@/lib/session";

// Cookie-store session access + route-handler guards. Server components and
// route handlers only — proxy.ts uses lib/session.ts directly (no next/headers,
// no Prisma).

/**
 * The JWT's claims, unverified against the database. Cheap, but the role and
 * account status inside it are only as fresh as the cookie — which lives for a
 * week. Never authorize on this; use requireAuth/requireRole/requirePageRole.
 */
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  return verifySession(cookieStore.get(SESSION_COOKIE)?.value);
}

/**
 * The session, reconciled against the database.
 *
 * The cookie is a 7-day stateless JWT, so `role` and account status are baked
 * in at sign-in. Without this read, deactivating a user or demoting an admin
 * would not take effect until their cookie expired — an admin could
 * "deactivate" someone who then keeps working for a week. So the token is
 * treated as an identity claim only; role and isActive come from the row.
 *
 * Cost is one indexed lookup per guarded request.
 */
async function reconcile(
  session: SessionPayload | null,
): Promise<{ session: SessionPayload; isActive: boolean } | null> {
  if (!session) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, name: true, email: true, role: true, isActive: true },
  });
  if (!user) return null; // deleted out from under a live cookie
  return {
    session: {
      userId: user.id,
      role: user.role, // authoritative, not the token's copy
      name: user.name,
      email: user.email,
    },
    isActive: user.isActive,
  };
}

export async function createSessionCookie(payload: SessionPayload): Promise<string> {
  const token = await signSession(payload);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_MS / 1000,
  });
  return token;
}

export async function destroySessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export class AuthError extends Error {
  constructor(
    public status: 401 | 403,
    message: string,
  ) {
    super(message);
  }
}

export const DEACTIVATED_MESSAGE =
  "Your account has been deactivated. Contact the wellness centre.";

/**
 * The reconciled session, or null if signed out or deactivated. Doesn't throw
 * or redirect — for places that merely want to route a visitor, like the
 * landing page. Use requireRole/requirePageRole to actually guard something.
 */
export async function getActiveSession(): Promise<SessionPayload | null> {
  const reconciled = await reconcile(await getSession());
  if (!reconciled || !reconciled.isActive) return null;
  return reconciled.session;
}

/** Session or throw. The proxy's check is optimistic; this is authoritative. */
export async function requireAuth(): Promise<SessionPayload> {
  const reconciled = await reconcile(await getSession());
  if (!reconciled) throw new AuthError(401, "Not authenticated");
  if (!reconciled.isActive) throw new AuthError(403, DEACTIVATED_MESSAGE);
  return reconciled.session;
}

/** Session with one of the given roles, or throw 401/403. */
export async function requireRole(...roles: UserRole[]): Promise<SessionPayload> {
  const session = await requireAuth();
  if (!roles.includes(session.role)) throw new AuthError(403, "Access denied");
  return session;
}

/**
 * Page guard: like requireRole, but redirects instead of throwing.
 *
 * Deactivated users go to /deactivated, not /login: the proxy bounces anyone
 * holding a valid cookie off /login to their dashboard, so sending them there
 * would loop. /deactivated is public and offers a sign-out.
 */
export async function requirePageRole(role: UserRole): Promise<SessionPayload> {
  const reconciled = await reconcile(await getSession());
  if (!reconciled) redirect("/login");
  if (!reconciled.isActive) redirect("/deactivated");
  if (reconciled.session.role !== role) {
    redirect(dashboardPath(reconciled.session.role));
  }
  return reconciled.session;
}
