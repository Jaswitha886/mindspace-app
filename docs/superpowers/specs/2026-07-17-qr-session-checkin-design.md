# QR session check-in — design

**Date:** 2026-07-17
**Status:** approved (pending spec review)

## Goal

A student shows a QR for their session. The counsellor scans it from their
dashboard. The counsellor then reads as **In session**, and can **End session**
to mark it `COMPLETED`.

## Why this is worth doing beyond the ask

`COMPLETED` is currently a **dead status**: read by the status filter, the
`StatusChip`, the affirmation-visibility rule and the counsellor schedule, but
**never written by any code path**. There is no way to mark a session as having
happened. This feature makes `COMPLETED` reachable for the first time.

## Core decision: "in session" is derived, never stored

A counsellor is *in session* when they have an appointment that is checked in,
not ended, and still inside its time window. Nothing is written to `User`.

This follows the rule the codebase already uses for counsellor assignment
(derived from appointments, not stored). A stored flag needs someone to unset
it; if a browser crashes mid-session the counsellor is stranded as permanently
busy and disappears from "Counsellors Available Now" until an admin intervenes.
A derived value cannot go stale.

## Schema

One nullable column. **No new enum value.**

```prisma
model Appointment {
  // ...
  checkedInAt DateTime? // set when the counsellor scans; kept after completion
}
```

| State | How it is known |
|---|---|
| Booked | `status = APPROVED`, `checkedInAt = null` |
| **In session** | `status = APPROVED`, `checkedInAt` set, `now < endTime + 30min` |
| Completed | `status = COMPLETED` (`checkedInAt` retained as the attendance record) |
| Attended but not closed | `status = APPROVED`, `checkedInAt` set, past the window |

`checkedInAt` survives completion — it is the record that the student actually
attended, which is distinct from the counsellor having closed the session.

## Stale sessions

Derived "in session" is false once `now > endTime + 30 minutes`. The counsellor
reappears as available automatically. The appointment stays `APPROVED`, **not**
`COMPLETED`: we know they checked in, we do not know the session happened, and
guessing writes a false clinical record. The counsellor can still close it later.

## The QR payload

A signed JWT via the existing `jose` setup in `src/lib/session.ts` — no new
dependency, no new secret.

```
{ appointmentId, studentId, iat, exp }
```

`exp` is the appointment's `endTime + 30min`. Never the raw appointment id: that
is a permanent, forgeable, guessable string that would work for anyone, forever.

**The signature is not what protects this.** These server checks are, and every
one is required on the check-in route:

1. caller passes `requireRole("COUNSELLOR")`
2. `appointment.counsellorId === caller.userId` — a counsellor cannot check in
   someone else's session
3. `appointment.status === "APPROVED"` — not pending, cancelled, rejected, done
4. `now` is within `[startTime - 15min, endTime + 30min]`
5. `checkedInAt` is null — idempotent; a second scan is a no-op, not an error

## Check-in window

The QR appears on the student dashboard only from **15 minutes before
`startTime` until `endTime + 30min`**. Outside it, the appointment card says when
the code will appear. A QR for a session three weeks away is noise, and a
long-lived code is a long-lived credential.

## Scanning

`BarcodeDetector` (native in Chrome/Edge/Android) — zero dependencies. Firefox
and Safari lack it, so **the QR is always accompanied by a short typed code**
that the counsellor can enter manually. That fallback is not a degraded path: it
is also the accessible route, and the answer when a camera is missing, denied, or
the lighting is bad. It goes through the identical server checks.

`getUserMedia` needs a secure context: fine on localhost, needs HTTPS in
production.

## Generating the QR

`qrcode` (one small dependency), rendered to **SVG server-side** on the student
dashboard, so it adds nothing to the client bundle.

## Surfaces

- **Student dashboard** — the imminent session's QR + typed code, in the existing
  upcoming-appointment card. Only within the check-in window.
- **Counsellor dashboard** — a "Scan check-in" control; when in session, the
  today's-sessions row shows an **In session** state and an **End session**
  button.
- **Student "Counsellors Available Now"** — a counsellor in session is excluded
  (they are not available).

## Privacy

The QR encodes an appointment id and student id, both already known to the
counsellor scanning it. It carries no mood, journal, or note data. Severity
rules are untouched.

## Out of scope

- Student-side "session started" UI beyond the QR
- Any admin view of attendance
- Extending QRs to the full `/student/appointments` list (dashboard only for now)
