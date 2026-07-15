# Mindspace - Master Project Prompt

## Project Overview

Mindspace is a campus-wide counselling management platform built for educational institutions.

The primary objective of the application is to simplify the counselling process by allowing students to book appointments with counsellors while providing counsellors with tools to manage sessions and administrators with analytics to identify trends and allocate resources.

The platform must prioritize privacy, simplicity, accessibility, and scalability.

---

# Tech Stack

Frontend

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui
- React Hook Form
- Zod

Backend

- Next.js Route Handlers
- Prisma ORM
- PostgreSQL

Authentication

- JWT / Session-based authentication (based on implementation)

---

# User Roles

There are three user roles.

## Student

Students can:

- Register an account
- Login
- Book counselling appointments
- View appointment history
- Cancel upcoming appointments
- Log daily mood
- Maintain a private journal
- Edit profile
- View affirmations published by counsellors

Students cannot:

- Access counsellor notes
- View analytics
- Modify appointment outcomes
- Access other students' information

---

## Counsellor

Counsellors can:

- Login
- View dashboard
- Approve or reject appointment requests
- View upcoming sessions
- Write session notes
- Edit session notes
- Assign severity levels
- Publish affirmations
- View weekly statistics
- View severity distribution graph
- Edit profile

Severity levels:

- Mild
- Moderate
- Critical

Counsellors cannot:

- View management analytics
- Access other counsellors' private notes

---

## Admin

Admins can:

- View platform analytics
- View department-wise counselling statistics
- View severity analytics
- View counsellor workload
- Filter analytics by date
- Filter analytics by department

Admins cannot:

- Read confidential session notes
- Modify counselling records

---

# Core Features

## Authentication

- Login
- Logout
- Register Student
- Role-based authorization
- Protected routes

---

## Student Module

Dashboard

Book Appointment

Appointment History

Mood Logging

Journal

Profile

Affirmations

Notifications

---

## Counsellor Module

Dashboard

Appointment Requests

Upcoming Sessions

Session Notes

Severity Classification

Weekly Statistics

Profile

Affirmations

---

## Admin Module

Dashboard

Department Analytics

Severity Analytics

Counsellor Performance

Weekly Reports

Monthly Reports

---

# Appointment Lifecycle

Student submits appointment request

↓

Counsellor receives request

↓

Counsellor approves or rejects

↓

Appointment scheduled

↓

Session conducted

↓

Counsellor records session notes

↓

Severity assigned

↓

Appointment completed

↓

Analytics automatically updated

---

# Mood Logging

Students should be able to:

- Log one mood per day
- View mood history
- View previous entries

Possible moods include:

- Happy
- Calm
- Neutral
- Anxious
- Sad
- Stressed

---

# Journal

Students should be able to:

- Create journal entries
- Edit entries
- Delete entries
- View previous entries
- Search entries

Journal entries are private.

---

# Session Notes

Each completed appointment should contain:

- Notes
- Severity
- Date
- Counsellor
- Student

Severity options:

- Mild
- Moderate
- Critical

Only counsellors can create or edit session notes.

Admins must never be able to read note contents.

---

# Analytics

The Admin dashboard should include:

Department-wise session count

Department-wise severity distribution

Counsellor-wise session count

Weekly session trends

Monthly session trends

Critical case trends

Filters:

- Date range
- Department
- Counsellor

---

# Design Philosophy

The interface should feel:

- Calm
- Premium
- Professional
- Trustworthy
- Minimal

Avoid clutter.

Avoid gradients.

Prefer whitespace over decorations.

---

# Design Language

The design should closely follow the provided reference image.

Characteristics:

- Warm off-white background
- Dark navy text
- Sage green accents
- Rounded cards
- Soft shadows
- Large spacing
- Elegant typography
- Minimal illustrations
- Dashboard-first layout
- Accessible contrast

---

# Coding Standards

Use TypeScript everywhere.

Avoid duplicated logic.

Keep components reusable.

Prefer Server Components where appropriate.

Keep business logic outside UI components.

Validate all forms using Zod.

Use React Hook Form for forms.

Keep database queries inside dedicated services or server actions.

---

# Folder Organization

Organize the project by feature instead of by page.

Example:

Authentication

Appointments

Profiles

Mood Logs

Journal

Affirmations

Analytics

Notifications

---

# Database

Use Prisma ORM.

Use PostgreSQL.

All relationships should use foreign keys.

Soft deletes should be preferred where appropriate.

Use enums for:

- Roles
- Appointment Status
- Severity

---

# Error Handling

Every API should return:

- Success
- Validation Error
- Unauthorized
- Forbidden
- Not Found
- Server Error

All forms must display user-friendly validation messages.

---

# Accessibility

Use semantic HTML.

Keyboard accessible components.

Visible focus states.

Proper labels.

ARIA attributes where necessary.

Responsive layouts.

---

# Performance

Optimize images.

Lazy load heavy components.

Avoid unnecessary client components.

Paginate large datasets.

Memoize expensive calculations where appropriate.

---

# AI Development Rules

Whenever implementing a feature:

1. Read the relevant documentation in the `docs` folder.
2. Do not break existing functionality.
3. Reuse existing components whenever possible.
4. Follow the established design system.
5. Keep TypeScript types strict.
6. Update documentation after completing the feature.
7. Do not introduce unnecessary dependencies unless required.
8. Preserve consistent naming conventions throughout the project.

---

# Project Goal

Build a production-ready counselling management platform that is scalable, maintainable, secure, and provides an intuitive experience for students, counsellors, and administrators while protecting sensitive counselling data.