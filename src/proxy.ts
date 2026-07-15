import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/session";

// Optimistic edge checks only (docs: app/getting-started/proxy).
//
// This runs at the edge with no database, so all it can see is the JWT's own
// claims. "Is this cookie a valid, unexpired token?" is answerable here and
// stays. **Role is not.** The token carries the role it was signed with up to
// seven days ago, so enforcing role here would reject a user an admin promoted
// a minute ago — they'd get 403s until their cookie expired. Worse, it would do
// it *before* requireRole ran, so the authoritative check never got a say.
//
// Role and account status are therefore decided exclusively by
// requireRole/requirePageRole (src/lib/auth.ts), which reconcile against the
// database. Every route under /api/{student,counsellor,admin} calls requireRole
// with its matching role, and every role-scoped page group's layout calls
// requirePageRole — so nothing is left unguarded by dropping the check here.

const PUBLIC_PAGES = new Set(["/", "/login", "/register", "/deactivated"]);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = await verifySession(request.cookies.get(SESSION_COOKIE)?.value);

  if (pathname.startsWith("/api")) {
    if (pathname.startsWith("/api/auth")) return NextResponse.next();
    if (!session) {
      return NextResponse.json(
        { success: false, message: "Not authenticated" },
        { status: 401 },
      );
    }
    return NextResponse.next();
  }

  // Signed-in users don't need the auth pages. dashboardPath() is skipped here
  // on purpose — the token's role may be stale, so send them to the root and
  // let the authoritative guards route them.
  if (session && (pathname === "/login" || pathname === "/register")) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (PUBLIC_PAGES.has(pathname)) return NextResponse.next();

  if (!session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Skip static assets and metadata files.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.svg$).*)"],
};
