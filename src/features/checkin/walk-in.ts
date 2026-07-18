import { prisma } from "@/lib/prisma";

// Creating a walk-in — a session for a student who arrived without a booking.
// Spec: docs/superpowers/specs/2026-07-18-counsellor-walkins-admin-scope-design.md
//
// A walk-in is a booked check-in with the booking skipped: it lands already
// APPROVED and already checked in, so from the first render it is
// indistinguishable from a scheduled session that was just scanned. Everything
// downstream — "in session", the Available-Now exclusion, End session,
// analytics — works on it unchanged, because none of them know or care that it
// had no prior appointment.

const WALK_IN_MINUTES = 50;

/** "HH:mm" in UTC — the string convention the rest of the app uses for times. */
function hhmm(d: Date): string {
  return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
}

export type WalkInResult =
  | { ok: true; appointmentId: string; studentName: string }
  | { ok: false; status: 400 | 404 | 409; message: string };

/**
 * Start a live walk-in session between this counsellor and a student.
 *
 * Refuses if the counsellor is already in a live session — one at a time, the
 * same rule that hides the check-in box while busy. That check and the create
 * run in one transaction so two rapid submits can't open two sessions.
 */
export async function startWalkIn(
  counsellorId: string,
  studentId: string,
): Promise<WalkInResult> {
  const student = await prisma.user.findFirst({
    where: { id: studentId, role: "STUDENT", isActive: true },
    select: { id: true, name: true },
  });
  if (!student) {
    return { ok: false, status: 404, message: "That student could not be found." };
  }

  const now = new Date();
  const day = new Date(now);
  day.setUTCHours(0, 0, 0, 0);
  const end = new Date(now.getTime() + WALK_IN_MINUTES * 60 * 1000);

  try {
    const appointment = await prisma.$transaction(async (tx) => {
      // "In session" can't be expressed as a Prisma filter (it depends on the
      // slot window, computed in app code), so re-derive it cheaply here: an
      // APPROVED, checked-in, not-yet-ended session of the counsellor's today.
      const liveToday = await tx.appointment.findFirst({
        where: {
          counsellorId,
          status: "APPROVED",
          checkedInAt: { not: null },
          appointmentDate: day,
        },
        select: { endTime: true, checkedInAt: true },
      });
      if (liveToday && `${hhmm(now)}` <= liveToday.endTime) {
        throw new WalkInBusy();
      }

      return tx.appointment.create({
        data: {
          studentId: student.id,
          counsellorId,
          appointmentDate: day,
          startTime: hhmm(now),
          endTime: hhmm(end),
          status: "APPROVED",
          checkedInAt: now,
          reason: "Walk-in (no prior appointment)",
        },
        select: { id: true },
      });
    });

    return { ok: true, appointmentId: appointment.id, studentName: student.name };
  } catch (e) {
    if (e instanceof WalkInBusy) {
      return {
        ok: false,
        status: 409,
        message: "You're already in a session. End it before starting a walk-in.",
      };
    }
    throw e;
  }
}

class WalkInBusy extends Error {}
