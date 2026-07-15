# Application Flow

This document defines the user journey for each role in Mindspace.

---

# Authentication Flow

Student / Counsellor / Admin

Login

↓

Credentials Verified

↓

JWT / Session Created

↓

Redirect to respective dashboard

---

# Student Flow

Login

↓

Student Dashboard

↓

Choose an action

• Book Appointment
• View Appointments
• Mood Logging
• Journal
• Profile
• View Affirmations

---

# Appointment Booking Flow

Student Dashboard

↓

Book Appointment

↓

Select Counsellor

↓

View Available Time Slots

↓

Select Date & Time

↓

Submit Appointment Request

↓

Status = Pending

↓

Counsellor Reviews Request

↓

Approved / Rejected

↓

If Approved

↓

Appointment appears in Upcoming Appointments

↓

Student attends counselling session

↓

Session Completed

↓

Appointment moved to History

---

# Mood Logging Flow

Student Dashboard

↓

Mood Logging

↓

Select Mood

↓

(Optional) Add Note

↓

Save Entry

↓

Mood History Updated

---

# Journal Flow

Student Dashboard

↓

Journal

↓

Create New Entry

↓

Enter Title

↓

Write Content

↓

Save Entry

↓

Entry appears in Journal History

↓

User can Edit or Delete Entry

---

# Profile Flow

Student Dashboard

↓

Profile

↓

Edit Details

↓

Save Changes

↓

Updated Profile Displayed

---

# Affirmation Flow

Student Dashboard

↓

Dashboard

↓

View Active Affirmations

↓

Read Affirmation

---

# Counsellor Flow

Login

↓

Counsellor Dashboard

↓

Choose an action

• View Appointment Requests
• Upcoming Sessions
• Session Notes
• Affirmations
• Profile

---

# Appointment Approval Flow

Counsellor Dashboard

↓

Pending Requests

↓

Open Appointment

↓

Review Details

↓

Approve or Reject

↓

Student Notified

↓

Status Updated

---

# Session Flow

Upcoming Session

↓

Conduct Counselling Session

↓

Open Session Notes

↓

Write Notes

↓

Select Severity

- Mild
- Moderate
- Critical

↓

Save Notes

↓

Appointment Completed

↓

Analytics Updated

---

# Counsellor Profile Flow

Dashboard

↓

Profile

↓

Edit

- Name
- Email
- Contact Number
- Years of Experience
- Role

↓

Save Changes

---

# Affirmation Management Flow

Dashboard

↓

Affirmations

↓

Create Affirmation

↓

Publish

↓

Students View Active Affirmation

---

# Admin Flow

Login

↓

Admin Dashboard

↓

View Analytics

↓

Apply Filters

↓

Analyse Data

---

# Department Analytics Flow

Admin Dashboard

↓

Department Analytics

↓

Filter by

- Department
- Date Range
- Week
- Month

↓

View Charts

---

# Severity Analytics Flow

Admin Dashboard

↓

Severity Analytics

↓

Filter by

- Date
- Department
- Counsellor

↓

View

- Mild Cases
- Moderate Cases
- Critical Cases

---

# Counsellor Performance Flow

Admin Dashboard

↓

Select Counsellor

↓

View

- Sessions This Week
- Sessions This Month
- Severity Distribution

---

# Overall Application Flow

Student

↓

Books Appointment

↓

Counsellor Receives Request

↓

Approves / Rejects

↓

Session Conducted

↓

Session Notes Added

↓

Severity Assigned

↓

Appointment Completed

↓

Admin Analytics Updated

---

# Access Matrix

| Feature | Student | Counsellor | Admin |
|---------|:-------:|:----------:|:-----:|
| Book Appointment | ✅ | ❌ | ❌ |
| Approve Appointment | ❌ | ✅ | ❌ |
| Session Notes | ❌ | ✅ | ❌ |
| Mood Logging | ✅ | ❌ | ❌ |
| Journal | ✅ | ❌ | ❌ |
| Affirmations | View | Create | ❌ |
| Department Analytics | ❌ | ❌ | ✅ |
| Severity Analytics | ❌ | Limited | ✅ |
| Profile | ✅ | ✅ | ❌ |

---

# Business Rules

- Students cannot book appointments in the past.
- Appointment slots cannot overlap.
- Counsellors can only edit their own session notes.
- Session notes remain private to the assigned counsellor.
- Admins can view analytics only and cannot access confidential session notes.
- Mood logs and journals are private to the student.
- Only active affirmations are visible to students.
- Every completed session must include a severity level.