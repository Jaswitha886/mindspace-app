import { google } from "googleapis";
import { prisma } from "@/lib/prisma";

// Google Calendar integration for counsellors.
// Each counsellor connects their own Google account via OAuth2.
// When an appointment is approved, a calendar event is created.
// When it's cancelled/rejected, the event is deleted.

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI,
);

/** Build the Google OAuth consent URL for a counsellor. */
export function buildGoogleAuthUrl(counsellorUserId: string): string {
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: ["https://www.googleapis.com/auth/calendar.events"],
    state: counsellorUserId, // passed through to identify the counsellor in callback
  });
}

/** Exchange an authorization code for tokens and store them. */
export async function handleGoogleCallback(code: string, counsellorUserId: string) {
  const { tokens } = await oauth2Client.getToken(code);
  await prisma.counsellorProfile.update({
    where: { userId: counsellorUserId },
    data: {
      googleAccessToken: tokens.access_token ?? null,
      googleRefreshToken: tokens.refresh_token ?? null,
      googleTokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
    },
  });
  return tokens;
}

/** Get an authenticated Google Calendar client for a counsellor. */
async function getCalendarClient(counsellorUserId: string) {
  const profile = await prisma.counsellorProfile.findUnique({
    where: { userId: counsellorUserId },
    select: {
      googleAccessToken: true,
      googleRefreshToken: true,
      googleTokenExpiry: true,
    },
  });

  if (!profile?.googleRefreshToken) return null;

  oauth2Client.setCredentials({
    access_token: profile.googleAccessToken,
    refresh_token: profile.googleRefreshToken,
    expiry_date: profile.googleTokenExpiry?.getTime() ?? undefined,
  });

  // Refresh if expired (or about to expire within 5 min)
  if (
    profile.googleTokenExpiry &&
    profile.googleTokenExpiry.getTime() - Date.now() < 5 * 60 * 1000
  ) {
    const { credentials } = await oauth2Client.refreshAccessToken();
    await prisma.counsellorProfile.update({
      where: { userId: counsellorUserId },
      data: {
        googleAccessToken: credentials.access_token ?? null,
        googleTokenExpiry: credentials.expiry_date
          ? new Date(credentials.expiry_date)
          : null,
      },
    });
  }

  return google.calendar({ version: "v3", auth: oauth2Client });
}

/** Check whether a counsellor has Google Calendar connected. */
export async function isGoogleConnected(counsellorUserId: string): Promise<boolean> {
  const profile = await prisma.counsellorProfile.findUnique({
    where: { userId: counsellorUserId },
    select: { googleRefreshToken: true },
  });
  return !!profile?.googleRefreshToken;
}

/** Create a calendar event for an approved appointment. Returns the event ID. */
export async function createCalendarEvent(params: {
  counsellorUserId: string;
  studentName: string;
  appointmentDate: Date;
  startTime: string; // "HH:mm"
  endTime: string;   // "HH:mm"
  reason?: string | null;
}): Promise<string | null> {
  const calendar = await getCalendarClient(params.counsellorUserId);
  if (!calendar) return null;

  // Build ISO datetime strings from the date + time components.
  // The date is stored as midnight UTC; we combine it with the HH:mm times.
  const dateStr = params.appointmentDate.toISOString().slice(0, 10);
  const startDateTime = `${dateStr}T${params.startTime}:00`;
  const endDateTime = `${dateStr}T${params.endTime}:00`;

  const event = await calendar.events.insert({
    calendarId: process.env.GOOGLE_CALENDAR_ID ?? "primary",
    requestBody: {
      summary: `Counselling Session — ${params.studentName}`,
      description: params.reason
        ? `Student: ${params.studentName}\nNote: ${params.reason}`
        : `Student: ${params.studentName}`,
      start: {
        dateTime: startDateTime,
        timeZone: "Asia/Kolkata",
      },
      end: {
        dateTime: endDateTime,
        timeZone: "Asia/Kolkata",
      },
      transparency: "opaque",
    },
  });

  return event.data.id ?? null;
}

/** Delete a calendar event. */
export async function deleteCalendarEvent(
  counsellorUserId: string,
  eventId: string,
): Promise<boolean> {
  const calendar = await getCalendarClient(counsellorUserId);
  if (!calendar) return false;

  try {
    await calendar.events.delete({
      calendarId: process.env.GOOGLE_CALENDAR_ID ?? "primary",
      eventId,
    });
    return true;
  } catch {
    // Event may already be deleted — treat as success.
    return false;
  }
}

/** Remove Google Calendar connection from a counsellor. */
export async function disconnectGoogleCalendar(counsellorUserId: string): Promise<void> {
  await prisma.counsellorProfile.update({
    where: { userId: counsellorUserId },
    data: {
      googleAccessToken: null,
      googleRefreshToken: null,
      googleTokenExpiry: null,
    },
  });
}
