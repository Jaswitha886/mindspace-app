import { prisma } from "@/lib/prisma";
import {
  createCalendarEvent,
  deleteCalendarEvent,
} from "@/features/google-calendar/google-calendar";

/**
 * After an appointment status change, sync the Google Calendar event.
 *
 * - APPROVED → create event (if counsellor has Google connected)
 * - REJECTED / CANCELLED → delete event (if one was created)
 * - COMPLETED → no calendar change (the event stays as a record)
 */
export async function syncCalendarEvent(appointmentId: string) {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    select: {
      id: true,
      status: true,
      appointmentDate: true,
      startTime: true,
      endTime: true,
      reason: true,
      counsellorId: true,
      googleCalendarEventId: true,
      student: { select: { name: true } },
      counsellor: { select: { name: true } },
    },
  });
  if (!appointment) return;

  const { status, googleCalendarEventId } = appointment;

  // Already has an event — only delete on reject/cancel.
  if (googleCalendarEventId) {
    if (status === "REJECTED" || status === "CANCELLED") {
      await deleteCalendarEvent(appointment.counsellorId, googleCalendarEventId);
      await prisma.appointment.update({
        where: { id: appointmentId },
        data: { googleCalendarEventId: null },
      });
    }
    return;
  }

  // No event yet — create on approval.
  if (status === "APPROVED") {
    const eventId = await createCalendarEvent({
      counsellorUserId: appointment.counsellorId,
      studentName: appointment.student.name,
      appointmentDate: appointment.appointmentDate,
      startTime: appointment.startTime,
      endTime: appointment.endTime,
      reason: appointment.reason,
    });

    if (eventId) {
      await prisma.appointment.update({
        where: { id: appointmentId },
        data: { googleCalendarEventId: eventId },
      });
    }
  }
}
