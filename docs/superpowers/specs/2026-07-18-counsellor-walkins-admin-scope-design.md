# Walk-ins, Schedule/History split, sign-out confirm, admin scope — design

**Date:** 2026-07-18
**Status:** approved

Four independent changes, built and verified one at a time in this order.

## 1. Walk-in sessions

A counsellor sees a student with no prior appointment and runs a session there
and then. It must count in the stats exactly like a booked session.

**A walk-in starts a live session immediately** — it is not logged after the
fact. The counsellor picks the student and an appointment is created *already
checked in*:

| Field | Value |
|---|---|
| `status` | `APPROVED` |
| `checkedInAt` | now |
| `appointmentDate` | today (00:00 UTC) |
| `startTime` | now, `"HH:mm"` UTC |
| `endTime` | now + 50 min, `"HH:mm"` UTC |
| `availabilityId` | null — a walk-in fills no slot |

From that moment it is **indistinguishable from a booked check-in**: the
counsellor reads "In session", drops out of "Counsellors Available Now", hits
End session → `COMPLETED`, writes the note. Every stat counts it automatically
because analytics count appointments — no special-casing anywhere downstream.

Endpoints (both counsellor-only):
- `GET /api/students?q=` — search registered students by name or register
  number. Returns `id`, `name`, `registerNumber`, `department`. The student
  must be a real user so the session ties to their department for analytics.
- `POST /api/appointments/walk-in` — body `{ studentId }`. Creates the row above.

Guards:
- **One live session at a time.** If the counsellor is already in session, the
  walk-in is refused — the same rule that hides the check-in box while busy.
- Student must exist and have role `STUDENT`.
- **No slot-conflict check.** Walk-ins are unscheduled by nature; a walk-in may
  overlap a booked session. This is deliberate, not an oversight.

UI: a "Walk-in" control on **Schedule**, beside check-in. A search box over
students; picking one starts the session and the page reflects "In session".
Hidden while already in session (same as check-in).

## 2. Schedule (upcoming) vs History (past)

Notes already have full add/edit at `/counsellor/notes/[id]`. "History with
notes" is therefore a *past-sessions list* that links into that editor — no new
note code.

- **Schedule** → `status APPROVED`, `appointmentDate >= today`. Upcoming and
  today's confirmed sessions; where check-in and walk-ins happen.
- **History** (new nav tab, new page `/counsellor/history`) → `COMPLETED` (any
  date), plus `APPROVED` whose `appointmentDate < today` (past confirmed never
  closed — no-shows or forgotten). Each row links to the note editor. Most
  recent first.

Counsellor nav gains **History** between Schedule and Profile.

## 3. Sign-out confirmation (all three roles)

`LogoutButton` becomes two-step: a click swaps it for an inline "Sign out? /
Cancel" rather than firing immediately. No modal infrastructure — it works for
both the icon-only sidebar button and the full button, and stays keyboard- and
screen-reader-navigable. Applies everywhere the button appears, so all three
roles get it from one change.

## 4. Admin scope: analytics only

The admin is for management to read aggregate patterns and act on a spike in
critical flags — not a control system over student data.

Deleted:
- the Users page (`/admin/users`) and `UserTable`
- the user-management API routes (`/api/admin/users/*`)
- "Users" from the admin nav

Kept, unchanged:
- **Analytics** (`/admin`) — already aggregate-only: counts, department splits
  (suppressed under the cohort floor), counsellor load. No individual student
  data is shown, so nothing here needs changing.
- **Alerts** (`/admin/notifications`) — already department-only, no student names.
- **Profile** (`/admin/profile`) — account details + theme toggle.

**Consequence, accepted:** account deactivation was only reachable from the
Users page, so it goes away entirely. The `isActive` machinery (the login block,
the `/deactivated` page, the `requireAuth` check) stays in place but becomes
unreachable — no code path sets `isActive = false` anymore. Left intact rather
than ripped out: it's harmless, and a future admin control could re-enable it.

## Out of scope

- Editing/cancelling a walk-in once started (End session already closes it)
- Any student-facing view of walk-ins (they see it in their own appointments
  list like any other session)
- Re-homing account deactivation elsewhere
