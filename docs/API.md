# API Documentation

This document defines the REST API endpoints for Mindspace.

Base URL

```
/api
```

---

# Authentication

## Register Student

**POST**

```
/auth/register
```

### Request

```json
{
  "name": "John Doe",
  "email": "john@srmist.edu.in",
  "password": "********",
  "confirmPassword": "********",
  "registerNumber": "RA2111003010001",
  "department": "Computer Science",
  "semester": 3,
  "phoneNumber": "+91 98765 43210"
}
```

### Response (201)

```json
{
  "success": true,
  "message": "Account created successfully. Please sign in.",
  "data": {
    "user": {
      "id": "clx1234...",
      "name": "John Doe",
      "email": "john@srmist.edu.in",
      "role": "STUDENT"
    }
  }
}
```

### Validation Errors (400)

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "email": ["Please enter a valid email address"],
    "password": ["Password must be at least 8 characters"]
  }
}
```

### Duplicate Email (400)

```json
{
  "success": false,
  "message": "An account with this email already exists"
}
```

---

## Login

**POST**

```
/auth/login
```

### Request

```json
{
  "email": "john@srmist.edu.in",
  "password": "********"
}
```

### Response (200)

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "clx1234...",
      "name": "John Doe",
      "email": "john@srmist.edu.in",
      "role": "STUDENT"
    },
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "redirectPath": "/student"
  }
}
```

### Invalid Credentials (401)

```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

---

## Logout

**POST**

```
/auth/logout
```

### Response (200)

```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## Current User

**GET**

```
/auth/me
```

Returns the authenticated user's information including profile data.

### Response (200)

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "clx1234...",
      "name": "John Doe",
      "email": "john@srmist.edu.in",
      "role": "STUDENT",
      "createdAt": "2026-01-01T00:00:00.000Z",
      "studentProfile": {
        "id": "clx1234...",
        "registerNumber": "RA2111003010001",
        "department": "Computer Science",
        "semester": 3,
        "phoneNumber": "+91 98765 43210"
      },
      "counsellorProfile": null
    }
  }
}
```

### Not Authenticated (401)

```json
{
  "success": false,
  "message": "Not authenticated"
}
```

---

# Authentication Details

## Session Management

- JWT tokens stored in HTTP-only cookies
- Cookie name: `mindspace-session`
- Token expiry: 7 days
- SameSite: Lax
- Secure: Enabled in production

## Password Security

- Passwords hashed with bcryptjs (12 salt rounds)
- Minimum 8 characters
- Must contain uppercase, lowercase, and number

## Registration Rules

- Public registration creates STUDENT accounts only
- Admin and Counsellor accounts are created via seed script or database
- Email must be unique across all users

## Role-Based Access

| Role | Access |
|------|--------|
| Student | Student APIs, /student routes |
| Counsellor | Counsellor APIs, /counsellor routes |
| Admin | Admin APIs, /admin routes |

## Protected Routes

All routes except `/`, `/login`, `/register`, and `/api/auth/*` require authentication.

API routes validate both authentication and role-based authorization.

# Student APIs

## Dashboard

**GET**

```
/student/dashboard
```

Returns:

- Upcoming Appointment
- Recent Mood
- Recent Journal Entries
- Active Affirmations

---

## Profile

### Get Profile

```
GET /api/student/profile
```

### Update Profile

```
PATCH /api/student/profile
```

Editable: `name`, `phoneNumber`, `semester`. Email is tied to auth and not
editable. A name change re-issues the session cookie.

---

## Affirmations Feed (student view)

```
GET /api/student/affirmations
```

Active affirmations visible to this student, most recent first: targeted ones,
plus broadcasts from counsellors the student shares an APPROVED/COMPLETED
appointment with (assignment is derived from bookings — there is no persistent
student→counsellor link).

---

# Counsellor List API

## List Counsellors

**GET**

```
/api/counsellors
```

Returns all counsellors with their profiles.

### Response (200)

```json
{
  "success": true,
  "data": {
    "counsellors": [
      {
        "id": "clx1234...",
        "contactNumber": "+91 98765 43210",
        "yearsOfExperience": 8,
        "specialization": "Student Mental Health & Career Guidance",
        "user": {
          "id": "clx1234...",
          "name": "Dr. Priya Sharma",
          "email": "priya.sharma@mindspace.edu.in"
        }
      }
    ]
  }
}
```

---

# Counsellor Slots API

## Get Available Slots

**GET**

```
/api/counsellors/:id/slots?date=2026-07-15
```

Returns available time slots for a counsellor on a given date. Filters out booked and past slots.

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| date | string | Yes | Date in YYYY-MM-DD format |

### Response (200)

```json
{
  "success": true,
  "data": {
    "slots": [
      {
        "startTime": "2026-07-15T09:00:00.000Z",
        "endTime": "2026-07-15T10:00:00.000Z",
        "booked": false,
        "past": false
      }
    ]
  }
}
```

### Validation Errors (400)

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "date": ["Date is required"]
  }
}
```

### Not Found (404)

```json
{
  "success": false,
  "message": "Counsellor not found"
}
```

---

# Appointment APIs

## Create Appointment

**POST**

```
/api/appointments
```

Books a new appointment. Prevents overlapping appointments for the same counsellor. Validates that the appointment is not in the past.

### Request

```json
{
  "counsellorId": "clx1234...",
  "date": "2026-07-15",
  "startTime": "10:00",
  "endTime": "11:00"
}
```

### Response (201)

```json
{
  "success": true,
  "message": "Appointment booked successfully. Awaiting counsellor approval.",
  "data": {
    "appointment": {
      "id": "clx1234...",
      "studentId": "clx1234...",
      "counsellorId": "clx1234...",
      "appointmentDate": "2026-07-15T00:00:00.000Z",
      "startTime": "2026-07-15T10:00:00.000Z",
      "endTime": "2026-07-15T11:00:00.000Z",
      "status": "PENDING",
      "counsellor": {
        "user": { "name": "Dr. Priya Sharma" },
        "specialization": "Student Mental Health & Career Guidance"
      }
    }
  }
}
```

### Validation Errors (400)

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "counsellorId": ["Please select a counsellor"],
    "date": ["Cannot book appointments in the past"]
  }
}
```

### Overlap Conflict (409)

```json
{
  "success": false,
  "message": "This counsellor already has an appointment during this time slot"
}
```

### Past Date Error (400)

```json
{
  "success": false,
  "message": "Cannot book appointments in the past"
}
```

---

## Appointment History

**GET**

```
/api/appointments?status=PENDING&page=1&limit=10
```

Returns paginated appointments for the authenticated student or counsellor.

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| status | string | No | Filter by status: PENDING, APPROVED, REJECTED, CANCELLED, COMPLETED |
| page | number | No | Page number (default: 1) |
| limit | number | No | Items per page (default: 10, max: 50) |

### Response (200)

```json
{
  "success": true,
  "data": {
    "appointments": [
      {
        "id": "clx1234...",
        "appointmentDate": "2026-07-15T00:00:00.000Z",
        "startTime": "2026-07-15T10:00:00.000Z",
        "endTime": "2026-07-15T11:00:00.000Z",
        "status": "PENDING",
        "createdAt": "2026-07-11T00:00:00.000Z",
        "student": {
          "user": { "name": "Ananya Krishnan", "email": "ananya.krishnan@srmist.edu.in" },
          "registerNumber": "RA2111003010001",
          "department": "Computer Science",
          "semester": 5,
          "phoneNumber": "+91 98765 43210"
        },
        "counsellor": {
          "user": { "name": "Dr. Priya Sharma", "email": "priya.sharma@mindspace.edu.in" },
          "specialization": "Student Mental Health & Career Guidance"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 12,
      "totalPages": 2
    }
  }
}
```

---

## Appointment Details

**GET**

```
/api/appointments/:id
```

Returns full appointment details including student, counsellor, and session notes (if completed). Access restricted to the owning student or assigned counsellor.

### Response (200)

```json
{
  "success": true,
  "data": {
    "appointment": {
      "id": "clx1234...",
      "appointmentDate": "2026-07-15T00:00:00.000Z",
      "startTime": "2026-07-15T10:00:00.000Z",
      "endTime": "2026-07-15T11:00:00.000Z",
      "status": "COMPLETED",
      "createdAt": "2026-07-01T00:00:00.000Z",
      "student": {
        "user": { "name": "Ananya Krishnan", "email": "ananya.krishnan@srmist.edu.in" },
        "registerNumber": "RA2111003010001",
        "department": "Computer Science",
        "semester": 5,
        "phoneNumber": "+91 98765 43210"
      },
      "counsellor": {
        "user": { "name": "Dr. Priya Sharma", "email": "priya.sharma@mindspace.edu.in" },
        "specialization": "Student Mental Health & Career Guidance",
        "contactNumber": "+91 98765 43210",
        "yearsOfExperience": 8
      },
      "sessionNote": {
        "notes": "Student reported feeling overwhelmed with academic pressure...",
        "severity": "MODERATE",
        "createdAt": "2026-07-15T11:30:00.000Z"
      }
    }
  }
}
```

### Not Found (404)

```json
{
  "success": false,
  "message": "Appointment not found"
}
```

### Access Denied (403)

```json
{
  "success": false,
  "message": "Access denied"
}
```

---

## Cancel Appointment

**PATCH**

```
/api/appointments/:id/cancel
```

Cancels a pending appointment. Only the student who booked the appointment can cancel it. Only PENDING appointments can be cancelled.

### Response (200)

```json
{
  "success": true,
  "message": "Appointment cancelled successfully",
  "data": {
    "appointment": {
      "id": "clx1234...",
      "status": "CANCELLED"
    }
  }
}
```

### Invalid Status (400)

```json
{
  "success": false,
  "message": "Cannot cancel appointment with status \"APPROVED\". Only pending appointments can be cancelled."
}
```

### Not Found (404)

```json
{
  "success": false,
  "message": "Appointment not found"
}
```

### Access Denied (403)

```json
{
  "success": false,
  "message": "You can only cancel your own appointments"
}
```

---

# Mood Log APIs

Student-only. Mood is a categorical enum: HAPPY, CALM, NEUTRAL, ANXIOUS, SAD, STRESSED.

## Create Mood Entry

```
POST /api/student/moods
```

One entry per day — posting again the same day replaces that day's entry (upsert, returns 201).

### Request

```json
{
  "mood": "HAPPY",
  "note": "Feeling productive today."
}
```

---

## Get Mood History

```
GET /api/student/moods?days=30
```

Newest first. `days` defaults to 30 (max 365).

---

## Delete Mood Entry

```
DELETE /api/student/moods/:id
```

---

# Journal APIs

Student-only and structurally private: every query is scoped to the
authenticated student's id, and no counsellor/admin route can reach these
endpoints (proxy returns 403 for other roles).

## Create Journal Entry

```
POST /api/student/journal
```

Body: `{ "title"?: string, "content": string }`

---

## Get Journal Entries

```
GET /api/student/journal?q=search&page=1&limit=20
```

`q` searches title and content, case-insensitive.

---

## Update Journal Entry

```
PATCH /api/student/journal/:id
```

---

## Delete Journal Entry

```
DELETE /api/student/journal/:id
```

---

# Counsellor APIs

## Dashboard

```
GET /counsellor/dashboard
```

Returns:

- Pending Requests
- Upcoming Sessions
- Weekly Session Count
- Severity Graph

---

## Appointment Requests

```
GET /counsellor/appointments
```

---

## Approve Appointment

```
PATCH /api/appointments/:id/approve
```

Counsellor only, own appointment only, `PENDING` only. Notifies the student
(`APPOINTMENT_APPROVED`). No slot re-check is needed: `PENDING` already blocks
the slot, so an approvable request cannot be double-booked.

- `200` — `{ appointment: { id, status: "APPROVED" } }`
- `400` — not `PENDING`
- `403` — not this counsellor's appointment

---

## Reject Appointment

```
PATCH /api/appointments/:id/reject
```

Counsellor only, own appointment only, `PENDING` only. Notifies the student
(`APPOINTMENT_REJECTED`).

### Request (body optional)

```json
{ "reason": "I'm away that week — would Thursday 2pm work?" }
```

`reason` is stored on `Appointment.reason` and shown to the student.

---

# Counsellor Availability APIs

Counsellor only; always scoped to the session's own `userId`. **Phase 2 booking
depends on these**: with no active window, `getSlotsForDate()` returns nothing
and no student can book.

```
GET    /api/counsellor/availability
POST   /api/counsellor/availability
PATCH  /api/counsellor/availability/:id     { "isActive": false }
DELETE /api/counsellor/availability/:id
```

### POST request

```json
{
  "isRecurring": true,
  "dayOfWeek": 3,
  "specificDate": null,
  "startTime": "15:00",
  "endTime": "16:00"
}
```

A window is recurring (`dayOfWeek` 0–6) **or** one-off (`specificDate`), never
both — `getSlotsForDate()` matches on exactly one of them.

- `201` — created
- `400` — outside working hours (09:00–17:00), or end before start
- `409` — overlaps an existing active window on the same day

### DELETE

- `200` — removed
- `409` — upcoming `PENDING`/`APPROVED` appointments still reference it.
  `Appointment.availabilityId` is a nullable FK, so deleting would orphan a live
  booking rather than stop it. Disable it with `PATCH` instead.

---

## Create Session Note

```
POST /api/session-notes
```

Counsellor only, own appointment only. One note per appointment (`409` if one
exists — `PATCH` it instead). **Never visible to the student.**

### Request

```json
{
  "appointmentId": "",
  "notes": "",
  "severity": "MODERATE"
}
```

---

## Update Session Note

```
PATCH /api/session-notes/:id
```

Body: `{ "notes"?, "severity"? }`. Authoring counsellor only.

---

## Severity escalation (both note endpoints)

Setting a note to `CRITICAL` is an **action trigger, not a label**. In the same
transaction as the note write, `escalateCritical()`
(`src/features/notes/escalation.ts`):

1. creates a `CRITICAL_SEVERITY` `Notification` for **every** Admin, and
2. writes an `AuditLog` row — `action: CRITICAL_SEVERITY_FLAG`, `actorId` =
   counsellor, `targetId` = student, `metadata: { noteId, appointmentId }`.

Both commit with the note or not at all: a note can never be `CRITICAL` in the
database without its notification and audit trail. Rules:

- Fires only on a **transition into** `CRITICAL` — re-saving an already-critical
  note does not re-notify.
- The notification payload names the counsellor and student but **never carries
  note content**.
- If no Admin exists, the write **fails** rather than committing a silent
  escalation.
- Success message tells the counsellor admins were notified.

---

## Counsellor Profile

```
GET   /api/counsellor/profile
PATCH /api/counsellor/profile
```

Editable: `name`, `email`, `contactNumber`, `yearsOfExperience`.
`role` is **view-only** (admin-controlled) and is absent from the schema, so a
counsellor cannot self-promote by POSTing one.

Email is also the login identity: on change the server enforces uniqueness
(`409` with `errors.email`) and **re-signs the session cookie**, so the
counsellor isn't left holding a token naming an address they no longer own.

---

# Admin Notification APIs

```
GET   /api/admin/notifications
PATCH /api/admin/notifications   { "id"? }   // omit id to mark all read
```

Admin only, scoped to `recipientId = session.userId`. This is where a
`CRITICAL_SEVERITY` escalation is actually read — without it the notification
row would be written but invisible. UI: `/admin/notifications`.

---

# Admin User Management APIs

```
GET   /api/admin/users?q=&role=&status=&page=&limit=
PATCH /api/admin/users/:id        { "role"?, "isActive"? }
```

Admin only. The only surface that changes a role — registration hardcodes
`STUDENT` and never reads a role from the request body.

Every change writes an `AuditLog` row: `ROLE_ASSIGNED` (moving off the `STUDENT`
default) or `ROLE_CHANGED`, and `USER_DEACTIVATED` / `USER_ACTIVATED`.

Guards, all `409`:

- **Self-edit** — an admin can't change their own role or status; they could
  lock themselves out of the only surface that undoes it.
- **Last active admin** — can't demote or deactivate the final one. Roles are
  admin-assigned, so a zero-admin platform can't repair itself through the UI.

Deactivating a counsellor with upcoming appointments **succeeds** and returns
`data.warnings` naming the conflict. Nothing is auto-cancelled — students agreed
to those sessions; a human decides.

## What deactivation actually does

`isActive: false` takes effect **immediately, on live sessions** — not when the
7-day JWT expires:

- `requireAuth()` reconciles the token against the database on every guarded
  request, so `role` and `isActive` are always the row's, never the cookie's.
  A demoted admin loses admin on their next request; a deactivated user is
  rejected `403` at once.
- Login is refused `403` (checked *after* the password verifies, so it can't be
  used to probe which accounts exist).
- Pages redirect to `/deactivated` — public by necessity, since the proxy
  bounces valid-cookie holders off `/login` and would otherwise loop them.
- The counsellor disappears from `/api/counsellors`, their slots `404`, and
  booking them by id `404`s.

Cost: one indexed lookup per guarded request. **The proxy makes no role
decisions** — at the edge it has no database and only the token's stale claims,
so it checks session presence only. Role is decided exclusively by
`requireRole` / `requirePageRole`.

---

# Affirmation APIs

## Create Affirmation

```
POST /affirmations
```

---

## Get Affirmations

```
GET /affirmations
```

---

## Update Affirmation

```
PATCH /affirmations/:id
```

---

## Delete Affirmation

```
DELETE /affirmations/:id
```

---

# Admin APIs

## Dashboard

```
GET /admin/dashboard
```

Returns dashboard summary cards.

---

## Department Analytics

```
GET /admin/analytics/departments
```

### Optional Query Parameters

```
department

startDate

endDate
```

---

## Severity Analytics

```
GET /admin/analytics/severity
```

Filters:

- Week
- Month
- Department
- Counsellor

---

## Counsellor Statistics

```
GET /admin/analytics/counsellors
```

Returns:

- Sessions Completed
- Weekly Sessions
- Monthly Sessions
- Severity Breakdown

---

# Common Response Format

## Success

```json
{
  "success": true,
  "data": {}
}
```

---

## Error

```json
{
  "success": false,
  "message": "Something went wrong."
}
```

---

# Authentication

Protected routes require authentication.

Public Routes

- Register
- Login

Protected Routes

- Student
- Counsellor
- Admin

---

# Authorization

| Role | Access |
|------|--------|
| Student | Student APIs |
| Counsellor | Counsellor APIs |
| Admin | Admin APIs |

---

# Validation

All incoming requests must be validated using Zod.

Validation failures should return HTTP **400 Bad Request**.

Unauthorized requests should return **401 Unauthorized**.

Forbidden requests should return **403 Forbidden**.

Server errors should return **500 Internal Server Error**.

---

# API Version

Current Version

```
v1
```

Future breaking changes should be introduced under:

```
/api/v2
```

---

# References

- PROJECT.md
- DATABASE.md
- APP_FLOW.md
- MASTER_PROMPT.md