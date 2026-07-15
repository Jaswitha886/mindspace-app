# Database Documentation

This document defines the database structure, relationships, and business rules for Mindspace.

---

# Database

- PostgreSQL
- Prisma ORM

---

# Enums

## UserRole

```prisma
enum UserRole {
  STUDENT
  COUNSELLOR
  ADMIN
}
```

---

## AppointmentStatus

```prisma
enum AppointmentStatus {
  PENDING
  APPROVED
  REJECTED
  CANCELLED
  COMPLETED
}
```

---

## SeverityLevel

```prisma
enum SeverityLevel {
  MILD
  MODERATE
  CRITICAL
}
```

---

## Mood

```prisma
enum Mood {
  HAPPY
  CALM
  NEUTRAL
  ANXIOUS
  SAD
  STRESSED
}
```

---

# Models

## User

Stores authentication and common user information.

### Fields

- id
- name
- email
- password
- role
- createdAt
- updatedAt

### Relationships

- One Student Profile
- One Counsellor Profile

---

## StudentProfile

Stores student-specific information.

### Fields

- id
- userId
- registerNumber
- department
- semester
- phoneNumber

### Relationships

- Belongs to User
- Has many Appointments
- Has many Mood Logs
- Has many Journal Entries

---

## CounsellorProfile

Stores counsellor-specific information.

### Fields

- id
- userId
- contactNumber
- yearsOfExperience
- specialization

### Relationships

- Belongs to User
- Has many Appointments
- Has many Session Notes
- Has many Affirmations

---

## Appointment

Stores appointment details.

### Fields

- id
- studentId
- counsellorId
- appointmentDate
- startTime
- endTime
- status
- createdAt
- updatedAt

### Relationships

- Belongs to Student
- Belongs to Counsellor
- Has one Session Note

---

## SessionNote

Stores notes written after counselling sessions.

### Fields

- id
- appointmentId
- counsellorId
- notes
- severity
- createdAt
- updatedAt

### Relationships

- Belongs to Appointment
- Belongs to Counsellor

---

## MoodLog

Stores daily mood entries.

### Fields

- id
- studentId
- mood
- note
- createdAt

### Relationships

- Belongs to Student

---

## JournalEntry

Stores private journal entries.

### Fields

- id
- studentId
- title
- content
- createdAt
- updatedAt

### Relationships

- Belongs to Student

---

## Affirmation

Stores affirmations created by counsellors.

### Fields

- id
- counsellorId
- message
- isActive
- createdAt

### Relationships

- Belongs to Counsellor

---

# Relationships

```
User
│
├── StudentProfile
│      ├── Appointments
│      ├── MoodLogs
│      └── JournalEntries
│
└── CounsellorProfile
       ├── Appointments
       ├── SessionNotes
       └── Affirmations

Appointment
        │
        └── SessionNote
```

---

# Business Rules

## Users

- Every email must be unique.
- Passwords must be hashed (bcryptjs, 12 salt rounds).
- Role cannot change after account creation unless performed by an administrator.
- Public registration creates STUDENT accounts only.
- Admin and Counsellor accounts are created via seed script.

---

## Students

- Can only edit their own profile.
- Can only access their own journals.
- Can only access their own mood logs.
- Cannot view other students' appointments.

---

## Counsellors

- Can only edit their own profile.
- Can only manage appointments assigned to them.
- Can only edit their own session notes.

---

## Appointments

- Cannot overlap for the same counsellor (enforced via API with time-range overlap query).
- Cannot be booked in the past (validated on both API and client).
- Only approved appointments can become completed.
- Every completed appointment must have one session note.
- Only PENDING appointments can be cancelled by the student.
- Students can only cancel their own appointments.
- Overlap check uses `startTime < new.endTime AND endTime > new.startTime` against existing PENDING/APPROVED appointments.
- Working hours: 9:00 AM - 5:00 PM, 60-minute slots.
- Default status on creation: PENDING.
- Counsellors can only manage appointments assigned to them.

---

## Session Notes

- Must include a severity level.
- Only assigned counsellor can edit.
- Admins cannot read note contents.

---

## Mood Logs

- Maximum one mood log per student per day.
- Mood history cannot be deleted by other users.

---

## Journal Entries

- Private to the student.
- Support Create, Read, Update and Delete.

---

## Affirmations

- Only counsellors can create affirmations.
- Students can only view active affirmations.

---

# Future Database Enhancements

- Notification table
- File attachments for session notes
- Emergency contact records
- Audit logs
- Activity history
- Calendar availability table
- Email reminder logs

---

# Seed Data

The seed script (`prisma/seed.ts`) populates the database with sample data for development and testing.

### Running the Seed Script

```bash
npm run db:seed
```

## Accounts

### Admin Account

- **Email:** admin@mindspace.edu.in
- **Password:** Admin@Mindspace2026
- **Role:** ADMIN

### Counsellor Accounts

| Name | Email | Specialization | Experience | Contact |
|------|-------|---------------|------------|---------|
| Dr. Priya Sharma | priya.sharma@mindspace.edu.in | Student Mental Health & Career Guidance | 8 years | +91 98765 43210 |
| Dr. Arjun Menon | arjun.menon@mindspace.edu.in | Clinical Psychology & Stress Management | 12 years | +91 87654 32109 |
| Dr. Meera Reddy | meera.reddy@mindspace.edu.in | Adolescent Counselling & Behavioural Therapy | 5 years | +91 76543 21098 |

### Student Accounts

| Name | Email | Register Number | Department | Semester |
|------|-------|----------------|------------|----------|
| Ananya Krishnan | ananya.krishnan@srmist.edu.in | RA2111003010001 | Computer Science | 5 |
| Rahul Verma | rahul.verma@srmist.edu.in | RA2111003010002 | Electronics & Communication | 4 |
| Priyanka Patel | priyanka.patel@srmist.edu.in | RA2111003010003 | Mechanical Engineering | 6 |
| Vikram Iyer | vikram.iyer@srmist.edu.in | RA2111003010004 | Information Technology | 3 |
| Deepa Nair | deepa.nair@srmist.edu.in | RA2111003010005 | Biotechnology | 5 |

## Sample Data Summary

| Model | Count | Details |
|-------|-------|---------|
| Users | 9 | 1 Admin, 3 Counsellors, 5 Students |
| Appointments | 12 | 5 completed, 2 approved, 3 pending, 1 rejected, 1 cancelled |
| Session Notes | 5 | One per completed appointment with severity levels |
| Mood Logs | 23 | Spread across 5 students over recent days |
| Journal Entries | 6 | Sample entries from 5 students |
| Affirmations | 6 | 5 active, 1 inactive across 3 counsellors |

## Appointment Distribution

| Student | Counsellor | Status | Days |
|---------|-----------|--------|------|
| Ananya Krishnan | Dr. Priya Sharma | COMPLETED | 14 days ago |
| Rahul Verma | Dr. Priya Sharma | COMPLETED | 10 days ago |
| Priyanka Patel | Dr. Arjun Menon | COMPLETED | 7 days ago |
| Vikram Iyer | Dr. Arjun Menon | COMPLETED | 5 days ago |
| Deepa Nair | Dr. Meera Reddy | COMPLETED | 3 days ago |
| Ananya Krishnan | Dr. Arjun Menon | APPROVED | 2 days from now |
| Priyanka Patel | Dr. Priya Sharma | APPROVED | 3 days from now |
| Rahul Verma | Dr. Meera Reddy | PENDING | 5 days from now |
| Vikram Iyer | Dr. Priya Sharma | PENDING | 6 days from now |
| Deepa Nair | Dr. Arjun Menon | PENDING | 7 days from now |
| Rahul Verma | Dr. Priya Sharma | REJECTED | 2 days ago |
| Deepa Nair | Dr. Priya Sharma | CANCELLED | 1 day ago |

---

# Migration Rules

Whenever the database changes:

1. Update Prisma schema.
2. Generate migration.
3. Apply migration.
4. Update this document.
5. Test affected APIs.

---

# References

- MASTER_PROMPT.md
- PROJECT.md
- API.md
- APP_FLOW.md