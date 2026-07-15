# Mindspace

## Overview

Mindspace is a campus-wide counselling management platform designed to simplify the process of connecting students with counsellors while giving administrators meaningful insights into campus mental health trends.

The platform focuses on privacy, accessibility, and an intuitive user experience.

---

# Objectives

- Simplify appointment booking for students.
- Reduce counsellor administrative work.
- Provide secure session documentation.
- Enable data-driven decision making for administrators.
- Maintain confidentiality of counselling records.

---

# Tech Stack

## Frontend

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui

## Backend

- Next.js Route Handlers
- Prisma ORM
- PostgreSQL

## Validation

- Zod
- React Hook Form

---

# User Roles

## Student

### Features

- Register & Login
- Dashboard
- Book Appointment
- View Appointment History
- Cancel Appointment
- Mood Logging
- Journal
- View Affirmations
- Edit Profile

---

## Counsellor

### Features

- Dashboard
- View Appointment Requests
- Approve / Reject Requests
- View Upcoming Sessions
- Write Session Notes
- Edit Session Notes
- Assign Severity Levels
- Publish Affirmations
- Weekly Statistics
- Severity Analytics
- Edit Profile

---

## Admin

### Features

- Dashboard
- Department Analytics
- Severity Analytics
- Counsellor Statistics
- Weekly Reports
- Monthly Reports
- Filter Analytics

---

# Modules

## Authentication

Handles:

- Login
- Registration
- Authorization
- Protected Routes

---

## Student Module

Handles:

- Dashboard
- Appointments
- Mood Logs
- Journal
- Profile
- Notifications
- Affirmations

---

## Counsellor Module

Handles:

- Dashboard
- Appointments
- Session Notes
- Severity Analysis
- Profile
- Affirmations

---

## Admin Module

Handles:

- Analytics Dashboard
- Department Reports
- Counsellor Reports
- Severity Reports

---

# Current Features

## Completed

- [x] Project initialization
- [x] Next.js setup
- [x] Prisma setup
- [x] PostgreSQL configuration
- [x] Environment variables
- [x] Database schema, migration & seed data
- [x] Authentication (register, login, logout, JWT sessions, role-based route protection)
- [x] Student Dashboard (home, sidebar nav)
- [x] Appointment Booking (slots, request, history, cancel)
- [x] Mood Logging (daily entry, 30-day trend chart)
- [x] Journal (private CRUD + search)
- [x] Student Profile & Affirmations feed

---

## In Progress

- [ ] Counsellor Dashboard (shell shipped; requests/sessions/notes/stats pending)
- [ ] Admin Dashboard (shell shipped; analytics pending)

---

## Planned

- [ ] Session Notes
- [ ] Severity Analytics
- [ ] Department Analytics
- [ ] Notifications UI (in-app records are already written on booking/cancel/critical)
- [ ] PWA Support

---

# Non-Functional Requirements

## Security

- Role-based authorization
- Secure password storage
- Protected API routes
- Private counselling notes

---

## Performance

- Fast page loads
- Optimized database queries
- Responsive UI
- Lazy loading where appropriate

---

## Accessibility

- Keyboard navigation
- Proper form labels
- Semantic HTML
- Responsive layouts

---

# Folder Structure

```
app/
components/
features/
lib/
prisma/
public/
docs/
```

---

# Design Principles

- Clean and minimal
- Calm visual language
- Premium appearance
- Soft rounded cards
- Consistent spacing
- Dashboard-first experience
- Mobile responsive
- Accessible interface

---

# Future Enhancements

- Email notifications
- SMS reminders
- Calendar integration
- AI-powered mood insights
- Emergency escalation workflow
- Multi-campus support
- Exportable reports

---

# References

- MASTER_PROMPT.md
- DATABASE.md
- APP_FLOW.md
- API.md
- DESIGN.md