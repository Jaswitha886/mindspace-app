import { createHmac } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import type { AppointmentStatus } from "@prisma/client";
import { slotDateTime } from "@/features/appointments/slots";

// QR session check-in. Spec: docs/superpowers/specs/2026-07-17-qr-session-checkin-design.md
//
// Server-only (node:crypto) — never import this from proxy.ts.
//
// The load-bearing idea: **"in session" is derived, never stored.** A flag on
// User would need someone to reliably unset it, and a browser that dies
// mid-session would strand the counsellor as permanently busy — invisible in
// "Counsellors Available Now" until an admin intervened. Derived state cannot
// go stale.

/** The code is live from 15 min before the slot until 30 min after it ends. */
export const CHECKIN_OPENS_BEFORE_MS = 15 * 60 * 1000;
export const CHECKIN_GRACE_AFTER_MS = 30 * 60 * 1000;

type Slot = { appointmentDate: Date; startTime: string; endTime: string };

/** Times are "HH:mm" read as UTC — the convention slots.ts already uses. */
export function checkInWindow(slot: Slot): { opens: Date; closes: Date } {
  return {
    opens: new Date(
      slotDateTime(slot.appointmentDate, slot.startTime).getTime() -
        CHECKIN_OPENS_BEFORE_MS,
    ),
    closes: new Date(
      slotDateTime(slot.appointmentDate, slot.endTime).getTime() +
        CHECKIN_GRACE_AFTER_MS,
    ),
  };
}

export function isWithinCheckInWindow(slot: Slot, now: Date = new Date()): boolean {
  const { opens, closes } = checkInWindow(slot);
  return now >= opens && now <= closes;
}

/**
 * In session = checked in, not yet closed, and still inside the window.
 *
 * The window clause is what makes a forgotten "End session" self-correcting: the
 * counsellor becomes available again on their own. The appointment deliberately
 * stays APPROVED rather than auto-completing — we know the student checked in,
 * we do not know the session happened, and guessing writes a false record.
 */
export function isInSession(
  appointment: Slot & { status: AppointmentStatus; checkedInAt: Date | null },
  now: Date = new Date(),
): boolean {
  if (appointment.status !== "APPROVED" || !appointment.checkedInAt) return false;
  return now <= checkInWindow(appointment).closes;
}

// ---- The QR payload -------------------------------------------------------

export type CheckInClaims = { appointmentId: string; studentId: string };

function secretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not set");
  return new TextEncoder().encode(secret);
}

/**
 * A signed token, not the raw appointment id: an id is a permanent, guessable
 * string that would check anyone in, forever. `exp` is the window's close, so
 * the code dies with the session.
 */
export async function signCheckInToken(
  claims: CheckInClaims,
  expiresAt: Date,
): Promise<string> {
  return new SignJWT({ ...claims, kind: "checkin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresAt)
    .sign(secretKey());
}

export async function verifyCheckInToken(
  token: string,
): Promise<CheckInClaims | null> {
  try {
    const { payload } = await jwtVerify<CheckInClaims & { kind?: string }>(
      token,
      secretKey(),
      { algorithms: ["HS256"] },
    );
    // `kind` stops a session cookie — signed with the same secret — from being
    // presented as a check-in code.
    if (payload.kind !== "checkin") return null;
    if (typeof payload.appointmentId !== "string" || typeof payload.studentId !== "string") {
      return null;
    }
    return { appointmentId: payload.appointmentId, studentId: payload.studentId };
  } catch {
    return null;
  }
}

// ---- The typed fallback code ----------------------------------------------

// No I/O/0/1 — those are what people mistype when reading a code aloud.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/**
 * A short code derived from the appointment id, for when the camera isn't an
 * option (Firefox/Safari have no BarcodeDetector, or there's no camera, or the
 * light is bad). Derived rather than stored: no column, no collision handling.
 *
 * Six characters is weak on its own — that is fine, because it is not the
 * security boundary. The server still requires that the caller is *the*
 * counsellor on that appointment and that it is in-window, and it only ever
 * matches the code against that counsellor's own handful of live sessions.
 */
export function sessionCode(appointmentId: string): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not set");
  const digest = createHmac("sha256", secret).update(appointmentId).digest();
  let out = "";
  for (let i = 0; i < 6; i++) out += ALPHABET[digest[i] % ALPHABET.length];
  return out;
}

/** "7K2M9Q" -> "7K2 M9Q" for reading aloud. Display only. */
export function formatSessionCode(code: string): string {
  return `${code.slice(0, 3)} ${code.slice(3)}`;
}

/** Accepts "7k2-m9q", "7K2 M9Q", "7K2M9Q" — people retype separators freely. */
export function normaliseSessionCode(input: string): string {
  return input.toUpperCase().replace(/[^A-Z0-9]/g, "");
}
