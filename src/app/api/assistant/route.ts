import { z } from "zod";
import { apiError, fail, ok, validationError } from "@/lib/api";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { SessionPayload } from "@/lib/session";
import {
  SLOT_BLOCKING_STATUSES,
  findCoveringAvailability,
  getSlotsForDate,
  overlaps,
  parseDateOnly,
  slotDateTime,
} from "@/features/appointments/slots";
import { startWalkIn } from "@/features/checkin/walk-in";
import { isInSession } from "@/features/checkin/checkin";
import { escalateCritical, shouldEscalate } from "@/features/notes/escalation";

const requestSchema = z.object({
  message: z.string().trim().min(1, "Tell me what you would like to do.").max(2000),
  history: z.array(z.object({
    from: z.enum(["user", "assistant"]),
    text: z.string().trim().max(2000),
  })).max(10).default([]),
});

type Suggestion = { label: string; prompt: string };
type AssistantResult = { reply: string; suggestions?: Suggestion[]; refreshed?: boolean };

const studentSuggestions: Suggestion[] = [
  { label: "Log mood", prompt: "__open_mood" },
  { label: "Book a session", prompt: "__open_booking" },
  { label: "My appointments", prompt: "Show my appointments" },
  { label: "Add journal", prompt: "Journal: " },
];

const counsellorSuggestions: Suggestion[] = [
  { label: "Add availability", prompt: "Add availability every Monday at 10am" },
  { label: "Approve next", prompt: "Approve my next pending request" },
  { label: "Start walk-in", prompt: "Start walk-in for " },
];

const adminSuggestions: Suggestion[] = [
  { label: "Show alerts", prompt: "Show my notifications" },
  { label: "Mark read", prompt: "Mark all notifications read" },
  { label: "Create suspension", prompt: "Suspend " },
];

const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function result(reply: string, suggestions: Suggestion[], refreshed = false): AssistantResult {
  return { reply, suggestions, refreshed };
}

function today(): Date {
  const value = new Date();
  value.setUTCHours(0, 0, 0, 0);
  return value;
}

function dateLabel(value: Date): string {
  return value.toLocaleDateString("en-IN", { month: "short", day: "numeric", timeZone: "UTC" });
}

function hasAny(text: string, phrases: string[]) {
  return phrases.some((phrase) => text.includes(phrase));
}

function textAfter(text: string, marker: RegExp): string {
  const match = text.match(marker);
  return match?.[1]?.trim() ?? "";
}

function parseTime(text: string): string | null {
  const match = text.match(/(?:\bat\s+|\bfrom\s+)([0-2]?\d)(?::([0-5]\d))?\s*(am|pm)?\b/i);
  if (!match) return null;
  let hour = Number(match[1]);
  const minutes = match[2] ?? "00";
  const period = match[3]?.toLowerCase();
  if (period === "pm" && hour < 12) hour += 12;
  if (period === "am" && hour === 12) hour = 0;
  if (hour > 23) return null;
  return `${String(hour).padStart(2, "0")}:${minutes}`;
}

function nextHour(time: string): string | null {
  const [hour, minute] = time.split(":").map(Number);
  if (hour >= 23) return null;
  return `${String(hour + 1).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function parseDate(text: string): Date | null {
  const match = text.match(/\b(20\d{2}-\d{2}-\d{2})\b/);
  if (match) return parseDateOnly(match[1]);
  const lower = text.toLowerCase();
  const base = today();
  if (lower.includes("tomorrow")) {
    base.setUTCDate(base.getUTCDate() + 1);
    return base;
  }
  if (lower.includes("today")) return base;
  return null;
}

function parseDay(text: string): number | null {
  const lower = text.toLowerCase();
  const index = dayNames.findIndex((day) => lower.includes(day.toLowerCase()));
  return index === -1 ? null : index;
}

function moodFrom(text: string): "HAPPY" | "CALM" | "NEUTRAL" | "ANXIOUS" | "SAD" | "STRESSED" | null {
  const mood = ["happy", "calm", "neutral", "anxious", "sad", "stressed"].find((item) =>
    new RegExp(`\\b${item}\\b`).test(text),
  );
  return mood ? (mood.toUpperCase() as "HAPPY" | "CALM" | "NEUTRAL" | "ANXIOUS" | "SAD" | "STRESSED") : null;
}

function bookingReason(text: string): string | null {
  const reason = textAfter(text, /(?:reason|because|for)\s*[:=-]?\s*(.+)$/i);
  return reason && reason.length <= 500 ? reason : null;
}

async function createAppointment(
  session: SessionPayload,
  counsellorId: string,
  date: Date,
  startTime: string,
  endTime: string,
  reason: string | null,
): Promise<AssistantResult> {
  if (slotDateTime(date, startTime) < new Date()) {
    return result("That time has already passed. Pick a future slot.", studentSuggestions);
  }
  const counsellor = await prisma.user.findFirst({
    where: { id: counsellorId, role: "COUNSELLOR", isActive: true },
    select: { id: true, name: true },
  });
  if (!counsellor) return result("That counsellor is no longer available.", studentSuggestions);

  const availability = await findCoveringAvailability(counsellor.id, date, startTime, endTime);
  if (!availability) {
    return result(`${counsellor.name} is not available for that full hour. Try another listed slot.`, studentSuggestions);
  }

  const appointment = await prisma.$transaction(async (tx) => {
    const clash = await tx.appointment.findFirst({
      where: {
        counsellorId: counsellor.id,
        appointmentDate: date,
        status: { in: [...SLOT_BLOCKING_STATUSES] },
        startTime: { lt: endTime },
        endTime: { gt: startTime },
      },
      select: { id: true },
    });
    if (clash) return null;
    const created = await tx.appointment.create({
      data: {
        studentId: session.userId,
        counsellorId: counsellor.id,
        availabilityId: availability.id,
        appointmentDate: date,
        startTime,
        endTime,
        reason,
      },
      select: { id: true },
    });
    await tx.notification.create({
      data: {
        recipientId: counsellor.id,
        type: "APPOINTMENT_REQUEST",
        payload: { appointmentId: created.id, studentName: session.name, date: date.toISOString().slice(0, 10), startTime },
      },
    });
    return created;
  });
  if (!appointment) return result("That slot was just taken. Ask me to book the next available session.", studentSuggestions);
  return result(`Booked with ${counsellor.name} for ${dateLabel(date)} at ${startTime}. It is awaiting approval.`, studentSuggestions, true);
}

async function bookNextAvailable(session: SessionPayload, reason: string | null) {
  const counsellors = await prisma.user.findMany({
    where: { role: "COUNSELLOR", isActive: true },
    select: { id: true },
    orderBy: { name: "asc" },
  });
  for (let offset = 0; offset < 28; offset += 1) {
    const date = today();
    date.setUTCDate(date.getUTCDate() + offset);
    for (const counsellor of counsellors) {
      const slot = (await getSlotsForDate(counsellor.id, date)).find((item) => !item.booked && !item.past);
      if (slot) return createAppointment(session, counsellor.id, date, slot.startTime.slice(11, 16), slot.endTime.slice(11, 16), reason);
    }
  }
  return result("I could not find an open slot in the next four weeks.", studentSuggestions);
}

function isConfirmation(text: string) {
  return /^\s*(?:confirm\b|yes\b|go ahead\b|book it\b|proceed\b)/i.test(text);
}

function needsConfirmation(role: SessionPayload["role"], text: string) {
  if (role === "STUDENT") {
    return (hasAny(text, ["mood", "feeling", "feel ", "journal", "diary"]) ||
      (hasAny(text, ["cancel", "remove"]) && hasAny(text, ["appointment", "session", "booking"]))) &&
      !hasAny(text, ["show", "list"]);
  }
  if (role === "COUNSELLOR") {
    return (hasAny(text, ["add availability", "create availability", "approve", "confirm", "decline", "reject", "walk-in", "walk in", "end session", "complete session", "save note", "add note", "share quote", "share affirmation"])) &&
      !hasAny(text, ["show", "list"]);
  }
  return hasAny(text, ["mark all", "clear notification", "suspend "]);
}

function confirmationResult(command: string, role: SessionPayload["role"]) {
  const suggestions = role === "STUDENT" ? studentSuggestions : role === "COUNSELLOR" ? counsellorSuggestions : adminSuggestions;
  return result("I have the details. Please confirm before I make that change.", [
    { label: "Confirm", prompt: `Confirm: ${command}` },
    { label: "Cancel", prompt: "Cancel this task" },
    ...suggestions.slice(0, 2),
  ]);
}

async function guideBooking(
  session: SessionPayload,
  message: string,
  history: { from: "user" | "assistant"; text: string }[],
): Promise<AssistantResult> {
  const userText = [...history, { from: "user" as const, text: message }]
    .filter((entry) => entry.from === "user")
    .map((entry) => entry.text)
    .join(" ");
  const date = parseDate(userText);
  const counsellors = await prisma.user.findMany({
    where: { role: "COUNSELLOR", isActive: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
  if (!date) {
    return result("Let’s book this step by step. What date works for you? You can say `tomorrow` or use YYYY-MM-DD.", [
      { label: "Tomorrow", prompt: "I want to book a session tomorrow" },
    ]);
  }
  if (date < today()) return result("That date has already passed. What future date would you prefer?", studentSuggestions);

  const counsellor = counsellors.find((item) => userText.toLowerCase().includes(item.name.toLowerCase()));
  if (!counsellor) {
    return result(`Great, ${dateLabel(date)}. Which counsellor would you like to see?`, counsellors.slice(0, 4).map((item) => ({
      label: item.name,
      prompt: `Book a session with ${item.name} on ${date.toISOString().slice(0, 10)}`,
    })));
  }

  const slots = (await getSlotsForDate(counsellor.id, date)).filter((slot) => !slot.booked && !slot.past);
  if (!slots.length) return result(`${counsellor.name} has no open slots on ${dateLabel(date)}. Pick another date or counsellor.`, studentSuggestions);
  const time = parseTime(userText);
  if (!time) {
    return result(`${counsellor.name} is available on ${dateLabel(date)}. Which time do you prefer?`, slots.slice(0, 5).map((slot) => ({
      label: slot.startTime.slice(11, 16),
      prompt: `Book a session with ${counsellor.name} on ${date.toISOString().slice(0, 10)} at ${slot.startTime.slice(11, 16)}`,
    })));
  }
  const slot = slots.find((item) => item.startTime.slice(11, 16) === time);
  if (!slot) return result(`That time is not open. Choose one of ${slots.slice(0, 4).map((item) => item.startTime.slice(11, 16)).join(", ")}.`, studentSuggestions);
  if (!isConfirmation(message)) {
    return result(`I have ${counsellor.name} on ${dateLabel(date)} from ${time} to ${slot.endTime.slice(11, 16)}. Would you like me to book it?`, [
      { label: "Confirm booking", prompt: `Confirm booking with ${counsellor.name} on ${date.toISOString().slice(0, 10)} at ${time}` },
      { label: "Choose another time", prompt: `Show times for ${counsellor.name} on ${date.toISOString().slice(0, 10)}` },
    ]);
  }
  return createAppointment(session, counsellor.id, date, time, slot.endTime.slice(11, 16), bookingReason(userText));
}

async function studentAssistant(
  session: SessionPayload,
  message: string,
  history: { from: "user" | "assistant"; text: string }[],
): Promise<AssistantResult> {
  const lower = message.toLowerCase();
  if (hasAny(lower, ["mood", "feeling", "feel "])) {
    const mood = moodFrom(lower);
    if (!mood) return result("Which mood should I log?", [
      { label: "Calm", prompt: "Log mood calm" }, { label: "Happy", prompt: "Log mood happy" }, { label: "Stressed", prompt: "Log mood stressed" },
    ]);
    const note = textAfter(message, /(?:note|because)\s*[:=-]?\s*(.+)$/i).slice(0, 1000) || null;
    await prisma.moodLog.upsert({
      where: { studentId_logDate: { studentId: session.userId, logDate: today() } },
      create: { studentId: session.userId, mood, note, logDate: today() },
      update: { mood, note },
    });
    return result(`Logged ${mood.toLowerCase()} for today${note ? " with your note" : ""}.`, studentSuggestions, true);
  }
  if (hasAny(lower, ["journal", "diary"])) {
    const content = textAfter(message, /(?:journal|diary)\s*:\s*([\s\S]+)$/i) || textAfter(message, /(?:add|save|write)\s+(?:a\s+)?(?:journal|diary)\s+(.+)$/i);
    if (!content) return result("Send the entry after `Journal:` and I will save it privately.", [{ label: "Start entry", prompt: "Journal: " }]);
    await prisma.journalEntry.create({ data: { studentId: session.userId, content: content.slice(0, 10000) } });
    return result("Your journal entry is saved.", studentSuggestions, true);
  }
  if (hasAny(lower, ["show", "list", "my "]) && hasAny(lower, ["appointment", "session", "booking"])) {
    const appointments = await prisma.appointment.findMany({
      where: { studentId: session.userId, status: { in: ["PENDING", "APPROVED"] }, appointmentDate: { gte: today() } },
      include: { counsellor: { select: { name: true } } }, orderBy: [{ appointmentDate: "asc" }, { startTime: "asc" }], take: 4,
    });
    if (!appointments.length) return result("You have no upcoming sessions.", studentSuggestions);
    return result(appointments.map((item) => `${dateLabel(item.appointmentDate)} ${item.startTime} with ${item.counsellor.name} (${item.status.toLowerCase()})`).join("\n"), studentSuggestions);
  }
  if (hasAny(lower, ["cancel", "remove"]) && hasAny(lower, ["appointment", "session", "booking"])) {
    const appointment = await prisma.appointment.findFirst({ where: { studentId: session.userId, status: "PENDING", appointmentDate: { gte: today() } }, orderBy: [{ appointmentDate: "asc" }, { startTime: "asc" }] });
    if (!appointment) return result("I could not find a pending appointment to cancel. Approved sessions need to be cancelled from the appointment page.", studentSuggestions);
    await prisma.appointment.update({ where: { id: appointment.id }, data: { status: "CANCELLED" } });
    return result(`Cancelled your pending session on ${dateLabel(appointment.appointmentDate)} at ${appointment.startTime}.`, studentSuggestions, true);
  }
  const bookingInProgress = history.some((entry) =>
    entry.from === "assistant" && entry.text.includes("Let’s book this step by step"),
  );
  if (hasAny(lower, ["book", "appointment", "session"]) || bookingInProgress) {
    return guideBooking(session, message, history);
  }
  return result("I can book sessions, log a mood, save a journal entry, and show or cancel a pending appointment.", studentSuggestions);
}

async function counsellorAssistant(session: SessionPayload, message: string): Promise<AssistantResult> {
  const lower = message.toLowerCase();
  if (hasAny(lower, ["end session", "complete session"])) {
    const candidates = await prisma.appointment.findMany({
      where: { counsellorId: session.userId, status: "APPROVED", checkedInAt: { not: null } },
      orderBy: { updatedAt: "desc" },
      take: 10,
    });
    const appointment = candidates.find((item) => isInSession(item));
    if (!appointment) return result("I could not find a live checked-in session to end.", counsellorSuggestions);
    await prisma.appointment.update({ where: { id: appointment.id }, data: { status: "COMPLETED" } });
    return result("The session has been marked complete.", counsellorSuggestions, true);
  }
  if (hasAny(lower, ["share quote", "share affirmation", "affirmation:", "quote:"])) {
    const quote = textAfter(message, /(?:quote|affirmation)\s*:\s*([\s\S]+)$/i);
    if (!quote) return result("Send the text after `Quote:` and I will share it with your students.", counsellorSuggestions);
    await prisma.affirmation.create({ data: { counsellorId: session.userId, message: quote.slice(0, 500) } });
    return result("Your affirmation is now shared with your students.", counsellorSuggestions, true);
  }
  if (hasAny(lower, ["save note", "add note", "session note", "note for"])) {
    const content = textAfter(message, /(?:note|session note)\s*:\s*([\s\S]+)$/i);
    if (!content) return result("Send the note after `Note:`. Add `critical`, `moderate`, or `mild` to set its severity.", counsellorSuggestions);
    const severity = lower.includes("critical") ? "CRITICAL" : lower.includes("moderate") ? "MODERATE" : "MILD";
    const appointment = await prisma.appointment.findFirst({
      where: { counsellorId: session.userId, status: { in: ["APPROVED", "COMPLETED"] } },
      include: { sessionNote: true },
      orderBy: [{ appointmentDate: "desc" }, { startTime: "desc" }],
    });
    if (!appointment) return result("I could not find a completed or approved session to attach that note to.", counsellorSuggestions);
    await prisma.$transaction(async (tx) => {
      const note = await tx.sessionNote.upsert({
        where: { appointmentId: appointment.id },
        create: { appointmentId: appointment.id, counsellorId: session.userId, content: content.slice(0, 10000), severity },
        update: { content: content.slice(0, 10000), severity },
      });
      if (shouldEscalate(appointment.sessionNote?.severity ?? null, severity)) {
        await escalateCritical(tx, { noteId: note.id, appointmentId: appointment.id, counsellorId: session.userId, counsellorName: session.name, studentId: appointment.studentId });
      }
    });
    return result(`Saved the ${severity.toLowerCase()} session note${severity === "CRITICAL" ? " and alerted admins" : ""}.`, counsellorSuggestions, true);
  }
  if (hasAny(lower, ["availability", "slot"]) && hasAny(lower, ["add", "create"])) {
    const startTime = parseTime(message);
    const day = parseDay(message);
    const date = parseDate(message);
    const endTime = startTime ? nextHour(startTime) : null;
    if (!startTime || !endTime || (day === null && !date)) return result("Use a weekday or YYYY-MM-DD plus a start time, for example: Add availability every Monday at 10am.", counsellorSuggestions);
    if (startTime < "09:00" || endTime > "17:00") return result("Availability must fall between 09:00 and 17:00.", counsellorSuggestions);
    const siblings = await prisma.availability.findMany({ where: { counsellorId: session.userId, isActive: true, ...(date ? { isRecurring: false, specificDate: date } : { isRecurring: true, dayOfWeek: day! }) }, select: { startTime: true, endTime: true } });
    if (siblings.some((slot) => overlaps(startTime, endTime, slot.startTime, slot.endTime))) return result("That overlaps an existing availability window.", counsellorSuggestions);
    await prisma.availability.create({ data: { counsellorId: session.userId, isRecurring: !date, dayOfWeek: date ? null : day, specificDate: date, startTime, endTime } });
    return result(`Added ${date ? `${dateLabel(date)} ` : `every ${dayNames[day!]} `}${startTime}-${endTime}.`, counsellorSuggestions, true);
  }
  if (hasAny(lower, ["approve", "confirm", "decline", "reject"])) {
    const appointment = await prisma.appointment.findFirst({ where: { counsellorId: session.userId, status: "PENDING" }, include: { student: { select: { name: true } } }, orderBy: [{ appointmentDate: "asc" }, { startTime: "asc" }] });
    if (!appointment) return result("You have no pending appointment requests.", counsellorSuggestions);
    const approved = hasAny(lower, ["approve", "confirm"]);
    await prisma.$transaction([
      prisma.appointment.update({ where: { id: appointment.id }, data: { status: approved ? "APPROVED" : "REJECTED" } }),
      prisma.notification.create({ data: { recipientId: appointment.studentId, type: approved ? "APPOINTMENT_APPROVED" : "APPOINTMENT_REJECTED", payload: { appointmentId: appointment.id, counsellorName: session.name } } }),
    ]);
    return result(`${approved ? "Approved" : "Declined"} ${appointment.student.name}'s ${dateLabel(appointment.appointmentDate)} request.`, counsellorSuggestions, true);
  }
  if (hasAny(lower, ["walk-in", "walk in"])) {
    const query = textAfter(message, /(?:walk-?in\s+for|start\s+walk-?in\s+for)\s+(.+)$/i);
    if (!query) return result("Tell me the student's name or register number, for example: Start walk-in for Alex.", counsellorSuggestions);
    const students = await prisma.user.findMany({ where: { role: "STUDENT", isActive: true, OR: [{ name: { contains: query, mode: "insensitive" } }, { studentProfile: { registerNumber: { contains: query, mode: "insensitive" } } }] }, select: { id: true, name: true }, take: 2 });
    if (students.length !== 1) return result(students.length ? `I found more than one match: ${students.map((student) => student.name).join(", ")}. Use a register number.` : "I could not find that active student.", counsellorSuggestions);
    const started = await startWalkIn(session.userId, students[0].id);
    return started.ok ? result(`Started a walk-in with ${started.studentName}.`, counsellorSuggestions, true) : result(started.message, counsellorSuggestions);
  }
  return result("I can add availability, manage the next request, start or end sessions, save session notes, and share affirmations. Profile settings stay in their dedicated screen.", counsellorSuggestions);
}

async function adminAssistant(session: SessionPayload, message: string): Promise<AssistantResult> {
  const lower = message.toLowerCase();
  if (hasAny(lower, ["notification", "alert"])) {
    if (hasAny(lower, ["mark", "read", "clear"])) {
      const { count } = await prisma.notification.updateMany({ where: { recipientId: session.userId, isRead: false }, data: { isRead: true } });
      return result(count ? `Marked ${count} notification${count === 1 ? "" : "s"} as read.` : "You are already caught up.", adminSuggestions, Boolean(count));
    }
    const rows = await prisma.notification.findMany({ where: { recipientId: session.userId }, orderBy: { createdAt: "desc" }, take: 5 });
    if (!rows.length) return result("You have no notifications.", adminSuggestions);
    return result(rows.map((row) => `${row.isRead ? "Read" : "Unread"}: ${row.type.replaceAll("_", " ").toLowerCase()}`).join("\n"), adminSuggestions);
  }
  if (hasAny(lower, ["suspend", "suspension"])) {
    const dates = [...message.matchAll(/\b(20\d{2}-\d{2}-\d{2})\b/g)].map((match) => match[1]);
    const studentQuery = textAfter(message, /suspend\s+(.+?)(?=\s+(?:from|reason|because|20\d{2}-\d{2}-\d{2})|$)/i);
    const reason = textAfter(message, /(?:reason|because)\s*[:=-]?\s*(.+)$/i);
    if (!studentQuery || dates.length < 2 || !reason) return result("Use: Suspend [student] from YYYY-MM-DD to YYYY-MM-DD because [reason].", adminSuggestions);
    const [startDate, endDate] = dates.map(parseDateOnly);
    if (!startDate || !endDate || endDate < startDate) return result("The suspension dates are not valid.", adminSuggestions);
    const students = await prisma.user.findMany({ where: { role: "STUDENT", OR: [{ name: { contains: studentQuery, mode: "insensitive" } }, { studentProfile: { registerNumber: { contains: studentQuery, mode: "insensitive" } } }] }, select: { id: true, name: true }, take: 2 });
    if (students.length !== 1) return result(students.length ? `More than one student matches: ${students.map((student) => student.name).join(", ")}. Use a register number.` : "I could not find that student.", adminSuggestions);
    const counsellors = await prisma.user.findMany({ where: { role: "COUNSELLOR", isActive: true }, select: { id: true } });
    if (!counsellors.length) return result("A suspension needs at least one active counsellor to notify.", adminSuggestions);
    const suspension = await prisma.$transaction(async (tx) => {
      const created = await tx.suspension.create({ data: { studentId: students[0].id, createdById: session.userId, reason: reason.slice(0, 2000), startDate, endDate } });
      await tx.notification.createMany({ data: counsellors.map((counsellor) => ({ recipientId: counsellor.id, suspensionId: created.id, type: "SUSPENSION_ALERT", payload: { suspensionId: created.id, studentId: students[0].id, studentName: students[0].name, reason, startDate: dates[0], endDate: dates[1] } })) });
      return created;
    });
    return result(`Created the suspension for ${students[0].name} and notified counsellors.`, adminSuggestions, Boolean(suspension));
  }
  return result("I can show or clear your notifications and create a suspension. User settings remain outside the assistant.", adminSuggestions);
}

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const parsed = requestSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return validationError(parsed.error);
    let message = parsed.data.message;
    const lower = message.toLowerCase();
    if (hasAny(lower, ["setting", "profile", "password", "email address", "phone number", "account detail"])) {
      return ok(result("I cannot change profile or account settings. Please use the dedicated settings screen for that.", session.role === "STUDENT" ? studentSuggestions : session.role === "COUNSELLOR" ? counsellorSuggestions : adminSuggestions));
    }
    const bookingIntent = session.role === "STUDENT" && hasAny(lower, ["book", "appointment", "session"]);
    const confirmationCarriesAction = hasAny(lower, ["mood", "journal", "diary", "book", "appointment", "session", "availability", "approve", "decline", "reject", "walk-in", "walk in", "note", "affirmation", "quote", "notification", "suspend"]);
    if (isConfirmation(message) && !confirmationCarriesAction) {
      const priorCommand = [...parsed.data.history].reverse().find((entry) => entry.from === "user" && !isConfirmation(entry.text));
      if (priorCommand) message = `${priorCommand.text} confirm`;
    } else if (isConfirmation(message) && hasAny(lower, ["mood", "journal", "diary"])) {
      // The confirmation label is workflow metadata, never journal or mood content.
      message = message.replace(/^\s*confirm\s*:\s*/i, "");
    } else if (!bookingIntent && needsConfirmation(session.role, lower)) {
      return ok(confirmationResult(message, session.role));
    }
    const response = session.role === "STUDENT"
      ? await studentAssistant(session, message, parsed.data.history)
      : session.role === "COUNSELLOR"
        ? await counsellorAssistant(session, message)
        : await adminAssistant(session, message);
    return ok(response);
  } catch (error) {
    return apiError(error, "assistant.execute");
  }
}
