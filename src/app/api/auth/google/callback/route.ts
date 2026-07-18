import { NextRequest, NextResponse } from "next/server";
import { handleGoogleCallback } from "@/features/google-calendar/google-calendar";

// Google OAuth2 callback. Exchanges the code for tokens and stores them
// on the counsellor's profile, then redirects to their profile page.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state"); // counsellorUserId

  if (!code || !state) {
    return NextResponse.redirect(
      new URL("/counsellor/profile?google=error", request.url),
    );
  }

  try {
    await handleGoogleCallback(code, state);
  } catch (e) {
    console.error("Google OAuth callback failed:", e);
    return NextResponse.redirect(
      new URL("/counsellor/profile?google=error", request.url),
    );
  }

  return NextResponse.redirect(
    new URL("/counsellor/profile?google=connected", request.url),
  );
}
