# Changelog

All notable changes to the Mindspace project will be documented here.

This project follows a chronological version history.

---

## [0.6.0] - 2026-07-14 - "Atrium" premium craft pass

### Changed

- Kept the mandated Fieldnotes palette but rebuilt the execution: a real surface ladder (gradient canvas, layered card shadows, colour used as calm FIELDS via `.field-sage` / `bg-moss-tint` / `.panel-warm`) replaces white-cards-on-near-white
- Confident editorial type scale (`.display-1/2`, `.heading`, mono `.overline`); softer geometry (20px cards, 12px controls, pill chips); hover `.lift` micro-interactions
- Student rail redesigned as a sage-washed panel with single-stroke line icons (`src/components/icons.tsx`), a `Wordmark`, and identity in the footer; auth pages rebuilt as a split brand/field layout (`AuthShell`); landing rebuilt with a field hero + three quiet feature promises
- Counsellor/admin moved to the shared `WorkspaceShell` with the cool `Wordmark` register tag; day-rail and KPI band restyled to the new tokens
- Refined primitives: `Button` (sizes + soft shadow + press), `Card` (`tone` + `interactive` lift), `PageTitle` (overline + display), fields (recessed wells + focus), `StatusChip` (dot + label), appointment `stub`

### Added

- New depth companion tokens (`--harbor-deep`, `--sage-deep`, `--moss-tint`, `--moss-veil`, `--canvas`, `--hairline-strong`, `--amber-tint`) — all AA companions to the mandated base five, not substitutions
- `Wordmark`, `AuthShell`, `icons.tsx`

### Documentation

- DESIGN.md: "Atrium refinement" section documenting the surface ladder, type scale, and geometry

---

## [0.5.1] - 2026-07-14 - Instrument-register dashboards (frames)

### Added

- Counsellor dashboard rebuilt as the Fieldnotes **day rail**: vertical time-spine of today's sessions (`<ol>` on a hairline spine with harbor time-nodes), a request queue, and a "This week" clinical ledger — severity shown as labelled rows with colour dots, never colour alone
- Admin dashboard rebuilt as the **no-cards** analytics surface: a horizontal KPI band of mono figures over hairline separators, then table-first "Department distribution" and "Counsellor workload" layouts with quiet "Insufficient data" empty states; copy states that note contents never surface to admins
- `WorkspaceShell` — the instrument top-bar chrome (mono register tag, no student sidebar) shared by both, keeping counsellor/admin a deliberately distinct register from the warm student app-shell

### Changed

- Retired the generic `DashboardShell` / `PlaceholderCard` placeholders (the last raw-admin-panel surfaces); counsellor/admin are now designed frames whose live data lands with the Phase 3/4 module builds

---

## [0.5.0] - 2026-07-14 - "Fieldnotes" end-to-end redesign

### Changed

- Full redesign on the user-mandated sage/slate palette with AA companion shades (ink-on-sage buttons — white-on-sage fails AA), amber as the single warm counterpoint, and a separate clinical severity token set
- Type: Bricolage Grotesque (display), Instrument Sans (UI), Newsreader (journal/affirmations), Geist Mono (all figures)
- Student home rebuilt as the asymmetric "Today panel": ambient hero with presence-based greeting and an inline tactile mood check-in strip; quiet column with one-time affirmation reveals
- Booking resequenced from one long form into three steps (person → day strip → time chips) ending in a ticket-shaped confirmation
- New signature element: appointment "stubs" — perforated ticket cards, shared anatomy with a plain counsellor register
- Hand-drawn empty-state illustrations (pressed leaf, two chairs, horizon) on student views only; hover/pressed micro-interactions on buttons and cards
- Counsellor/admin shells stay in the instrument register: no illustration, no amber, no playful motion

### Documentation

- DESIGN.md rewritten as the Fieldnotes system, including counsellor day-rail and admin no-cards layout concepts for Phases 3–4

---

## [0.4.0] - 2026-07-14 - "Porcelain & Plum" visual redesign

### Changed

- Full visual redesign (no data-model, role, or feature changes): porcelain/plum/dusty-rose palette (AA-verified), Newsreader + Hanken Grotesk + DM Mono type pairing, 16px "pebble" cards, frosted-halo page headers (warm on student/auth pages, near-neutral on counsellor/admin)
- Replaced the mood-ribbon card edge with the frosted halo as the signature element
- Calm-copy pass on all student-facing microcopy (invitations, never nudges; status chips read "Awaiting reply"/"Confirmed" instead of raw states)
- Buttons, chips, forms, sidebar, chart, and auth/landing pages restyled to the new tokens; sticky blurred headers

### Documentation

- DESIGN.md rewritten to document the Porcelain & Plum system

---

## [0.3.0] - 2026-07-14 - Phase 2: Student Module

### Added

- Booking APIs: `GET /api/counsellors`, `GET /api/counsellors/:id/slots?date=`, `POST /api/appointments` (availability check, past-date 400, overlap 409 inside a transaction), `GET /api/appointments` (paginated, role-scoped), `GET /api/appointments/:id`, `PATCH /api/appointments/:id/cancel` (PENDING only) — booking and cancelling notify the counsellor in-app
- Student APIs under `/api/student/*` (proxy-gated to STUDENT): moods (one per day, upsert), journal (CRUD + case-insensitive search, structurally private), profile (email read-only), affirmations feed (targeted + broadcasts from appointment-linked counsellors)
- Student UI: sidebar layout, dashboard home (next appointment with mood-ribbon gradient of last 5 moods, latest mood, recent journal, affirmations in Fraunces), booking flow with live slot picker, appointment history with status filters and cancel, mood page with 30-day Recharts trend (categorical y-axis of mood words), journal with inline editor and search, profile form
- Shared UI: Card with data-derived mood ribbon, StatusChip pills, sidebar nav

### Fixed

- Proxy role-prefix matching now respects path-segment boundaries (`/api/counsellors` was wrongly claimed by the `/api/counsellor` counsellor-only prefix)

### Documentation

- API.md: student endpoint paths (`/api/student/*`), mood upsert semantics, affirmation visibility rule

---

## [0.2.0] - 2026-07-14 - Phase 1: Foundation & Authentication

### Added

- Prisma 7 schema for all domain models (users, profiles, departments, availability, appointments, session notes, mood logs, journal, affirmations, notifications, audit log) with init migration and seed data
- Custom JWT authentication: `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me` (bcrypt 12 rounds, `mindspace-session` HTTP-only cookie, 7-day expiry)
- Route protection via `src/proxy.ts` (Next 16 proxy): public `/`, `/login`, `/register`, `/api/auth/*`; role-gated `/student`, `/counsellor`, `/admin` and matching API prefixes
- Server-side guards `requireAuth` / `requireRole` (APIs) and `requirePageRole` (pages)
- Login and registration pages with React Hook Form + Zod validation (shared schemas with the API)
- Landing page and role dashboard shells for student, counsellor, and admin
- Design tokens from DESIGN.md in `globals.css` (palette, focus ring, reduced-motion) with Fraunces / IBM Plex Sans / IBM Plex Mono

### Documentation

- Marked authentication complete in PROJECT.md

---

## [0.1.0] - Initial Project Setup

### Added

- Initialized Next.js project
- Configured TypeScript
- Installed Tailwind CSS
- Added shadcn/ui
- Configured Prisma ORM
- Connected PostgreSQL database
- Added environment variables
- Created initial project structure
- Added documentation in `/docs`

---

## Upcoming

### Authentication

- Student Registration
- Login
- Logout
- Protected Routes
- Role-Based Authorization

---

### Student Module

- Dashboard
- Appointment Booking
- Appointment History
- Mood Logging
- Journal
- Profile
- Affirmations

---

### Counsellor Module

- Dashboard
- Appointment Approval
- Session Notes
- Severity Flags
- Weekly Statistics
- Profile
- Affirmations

---

### Admin Module

- Dashboard
- Department Analytics
- Severity Analytics
- Counsellor Performance
- Weekly & Monthly Reports

---

## Versioning

### Format

```
Major.Minor.Patch
```

### Example

```
1.0.0
│ │ └── Bug Fixes
│ └──── New Features
└────── Breaking Changes
```

---

## Change Categories

### Added

New features.

### Changed

Existing functionality modified.

### Fixed

Bug fixes.

### Removed

Deleted features or components.

### Refactored

Internal improvements without changing functionality.

### Documentation

Updates to project documentation.

---

## Template

Copy this section whenever a new version is released.

```md
## [x.x.x] - YYYY-MM-DD

### Added

-

### Changed

-

### Fixed

-

### Removed

-

### Refactored

-

### Documentation

-
```