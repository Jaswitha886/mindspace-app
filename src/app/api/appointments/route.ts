import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole } from "@/lib/auth";
import { apiError, fail, ok, validationError } from "@/lib/api";
import {
  appointmentListQuerySchema,
  bookAppointmentSchema,
} from "@/features/appointments/validation";
import {
  SLOT_BLOCKING_STATUSES,
  findCoveringAvailability,
  parseDateOnly,
  slotDateTime,
} from "@/features/appointments/slots";
import {
  appointmentInclude,
  serializeAppointment,
} from "@/features/appointments/serialize";

// Book a new appointment (students only).
export async function POST(request: Request) {
  try {
    const session = await requireRole("STUDENT");

    const body = await request.json().catch(() => null);
    const parsed = bookAppointmentSchema.safeParse(body);
    if (!parsed.success) return validationError(parsed.error);
    const input = parsed.data;

    const date = parseDateOnly(input.date);
    if (!date || slotDateTime(date, input.startTime) < new Date()) {
      return fail("Cannot book appointments in the past", 400);
    }

    // isActive here is the server-side half of hiding deactivated counsellors:
    // dropping them from the list isn't enough if the id still books.
    const counsellor = await prisma.user.findFirst({
      where: { id: input.counsellorId, role: "COUNSELLOR", isActive: true },
      select: { id: true },
    });
    if (!counsellor) return fail("Counsellor not found", 404);

    const availability = await findCoveringAvailability(
      counsellor.id,
      date,
      input.startTime,
      input.endTime,
    );
    if (!availability) {
      return fail("This counsellor is not available at that time", 400);
    }

    // Overlap check + create inside one transaction to close the booking race.
    const appointment = await prisma.$transaction(async (tx) => {
      const clash = await tx.appointment.findFirst({
        where: {
          counsellorId: counsellor.id,
          appointmentDate: date,
          status: { in: [...SLOT_BLOCKING_STATUSES] },
          startTime: { lt: input.endTime },
          endTime: { gt: input.startTime },
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
          startTime: input.startTime,
          endTime: input.endTime,
          reason: input.reason ?? null,
        },
        include: appointmentInclude,
      });
      await tx.notification.create({
        data: {
          recipientId: counsellor.id,
          type: "APPOINTMENT_REQUEST",
          payload: {
            appointmentId: created.id,
            studentName: session.name,
            date: input.date,
            startTime: input.startTime,
          },
        },
      });
      return created;
    });

    if (!appointment) {
      return fail(
        "This counsellor already has an appointment during this time slot",
        409,
      );
    }

    return ok(
      { appointment: serializeAppointment(appointment) },
      {
        status: 201,
        message: "Appointment booked successfully. Awaiting counsellor approval.",
      },
    );
  } catch (error) {
    return apiError(error, "appointments.create");
  }
}

// Paginated history for the authenticated student or counsellor.
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    if (session.role === "ADMIN") {
      return fail("Access denied", 403); // admins see analytics, not raw appointments
    }

    const params = request.nextUrl.searchParams;
    const parsed = appointmentListQuerySchema.safeParse({
      status: params.get("status") ?? undefined,
      page: params.get("page") ?? undefined,
      limit: params.get("limit") ?? undefined,
    });
    if (!parsed.success) return validationError(parsed.error);
    const { status, page, limit } = parsed.data;

    const where = {
      ...(session.role === "STUDENT"
        ? { studentId: session.userId }
        : { counsellorId: session.userId }),
      ...(status ? { status } : {}),
    };

    const [total, rows] = await Promise.all([
      prisma.appointment.count({ where }),
      prisma.appointment.findMany({
        where,
        include: appointmentInclude,
        orderBy: [{ appointmentDate: "desc" }, { startTime: "desc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return ok({
      appointments: rows.map(serializeAppointment),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch (error) {
    return apiError(error, "appointments.list");
  }
}
