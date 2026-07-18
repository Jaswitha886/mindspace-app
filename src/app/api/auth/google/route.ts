import { redirect } from "next/navigation";
import { NextResponse, type NextRequest } from "next/server";
import { requireRole } from "@/lib/auth";
import { buildGoogleAuthUrl, disconnectGoogleCalendar } from "@/features/google-calendar/google-calendar";

// GET: Initiates the Google OAuth2 flow. The counsellor is redirected to
// Google's consent screen, then back to /api/auth/google/callback.
export async function GET() {
  let session;
  try {
    session = await requireRole("COUNSELLOR");
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = buildGoogleAuthUrl(session.userId);
  redirect(url);
}

// DELETE: Disconnect Google Calendar from a counsellor's account.
export async function DELETE() {
  let session;
  try {
    session = await requireRole("COUNSELLOR");
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await disconnectGoogleCalendar(session.userId);
  return NextResponse.json({ message: "Google Calendar disconnected" });
}
