import { prisma } from "@/lib/prisma";

// Slot logic shared by GET /api/counsellors/[id]/slots and POST /api/appointments.
// Dates are stored as midnight UTC (matching the seed); times are "HH:mm" strings.

/** Statuses that hold a slot. PENDING blocks too — two students must not be
 *  able to request the same slot and race for approval. */
export const SLOT_BLOCKING_STATUSES = ["PENDING", "APPROVED"] as const;

export function parseDateOnly(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function slotDateTime(date: Date, time: string): Date {
  return new Date(`${date.toISOString().slice(0, 10)}T${time}:00.000Z`);
}

export const overlaps = (
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string,
) => aStart < bEnd && bStart < aEnd;

export type Slot = {
  startTime: string; // ISO datetime, per docs/API.md
  endTime: string;
  booked: boolean;
  past: boolean;
};

/** All availability windows for a counsellor on a date, flagged booked/past. */
export async function getSlotsForDate(
  counsellorId: string,
  date: Date,
): Promise<Slot[]> {
  const [availabilities, appointments] = await Promise.all([
    prisma.availability.findMany({
      where: {
        counsellorId,
        isActive: true,
        OR: [
          { isRecurring: true, dayOfWeek: date.getUTCDay() },
          { isRecurring: false, specificDate: date },
        ],
      },
      orderBy: { startTime: "asc" },
    }),
    prisma.appointment.findMany({
      where: {
        counsellorId,
        appointmentDate: date,
        status: { in: [...SLOT_BLOCKING_STATUSES] },
      },
      select: { startTime: true, endTime: true },
    }),
  ]);

  const now = new Date();
  return availabilities.map((slot) => ({
    startTime: slotDateTime(date, slot.startTime).toISOString(),
    endTime: slotDateTime(date, slot.endTime).toISOString(),
    booked: appointments.some((a) =>
      overlaps(slot.startTime, slot.endTime, a.startTime, a.endTime),
    ),
    past: slotDateTime(date, slot.startTime) < now,
  }));
}

/** The availability window containing [start, end) on this date, if any. */
export async function findCoveringAvailability(
  counsellorId: string,
  date: Date,
  startTime: string,
  endTime: string,
) {
  return prisma.availability.findFirst({
    where: {
      counsellorId,
      isActive: true,
      startTime: { lte: startTime },
      endTime: { gte: endTime },
      OR: [
        { isRecurring: true, dayOfWeek: date.getUTCDay() },
        { isRecurring: false, specificDate: date },
      ],
    },
  });
}
